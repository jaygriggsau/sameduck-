import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { creditTransactions, jobOutputs, jobs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { CREDITS_PER_JOB } from "@/lib/credits";
import { MESSAGES } from "@/lib/messages";
import { persistReplicateOutputsToBlob } from "@/lib/blob";
import { getReplicateClient } from "@/lib/replicate";

const REPLICATE_MODEL = "openai/gpt-image-1.5";

const bodySchema = z.object({
  garmentImageDataUrl: z.string().min(1),
  modelPrompt: z.string().min(1),
  folderId: z.string().uuid().optional(),
});

function asDataUrlOrThrow(value: string, errorMessage: string) {
  if (!value.startsWith("data:image/")) {
    throw new Error(errorMessage);
  }
  return value;
}

async function maybeToUrl(value: unknown): Promise<string | null> {
  if (typeof value === "string" && value.length > 0) return value;
  if (value instanceof URL) return value.toString();
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  if (typeof obj.url === "string" && obj.url.length > 0) return obj.url;
  if (obj.url instanceof URL) return obj.url.toString();
  if (typeof obj.href === "string" && obj.href.length > 0) return obj.href;

  if (typeof obj.url === "function") {
    try {
      const resolved = await (obj.url as () => unknown)();
      return await maybeToUrl(resolved);
    } catch {
      return null;
    }
  }
  return null;
}

async function toOutputUrls(output: unknown): Promise<string[]> {
  if (!output) return [];
  if (!Array.isArray(output)) {
    const single = await maybeToUrl(output);
    return single ? [single] : [];
  }
  const urls = await Promise.all(output.map((item) => maybeToUrl(item)));
  return urls.filter((x): x is string => typeof x === "string" && x.length > 0);
}

// ── Garment fidelity clause injected into every prompt ───────────────────────
// Keeps the uploaded garment as the single source of truth across all images.
const GARMENT_GUARDRAIL = [
  "GARMENT FIDELITY — treat Input image 1 as the definitive source of truth for the clothing item.",
  "HIGHEST PRIORITY RULE: if any other instruction conflicts with garment fidelity, ignore the conflicting instruction and preserve the garment exactly as uploaded.",
  "You MUST reproduce every visible detail exactly as shown: fabric texture and weight, colour (do NOT shift, desaturate, or tint), surface pattern or print (scale, repeat, placement), silhouette and cut, collar/neckline shape, sleeve style and length, hem length and finish, all hardware (buttons, zippers, rivets, buckles, eyelets), pockets, stitching lines, branding or labels.",
  "Do NOT simplify, redesign, add, remove, crop, restyle, layer over, or reinterpret any part of the garment. Do NOT add accessories that occlude the garment (jackets, bags, scarves, props covering key areas).",
  "Keep garment fit natural but faithful: no altered neckline depth, sleeve length, hemline, print placement, or closure positions.",
  "The garment must look identical in every output image regardless of pose or angle.",
  "If the garment cannot be shown faithfully in a pose, adjust pose/body framing slightly to keep the garment accurate.",
].join(" ");

function buildSeedPrompt(modelPrompt: string) {
  return [
    "Create a photorealistic full-body fashion photoshoot image.",
    GARMENT_GUARDRAIL,
    `Place this exact garment on a model with a natural, fitted drape — no wrinkles or distortions beyond realistic wear. Define the model and scene entirely from this text description (appearance, body type, age range, hair, expression, photoshoot style, lighting): ${modelPrompt}.`,
    "Output one strong hero front-facing shot. This image is the identity seed for all follow-up pose variations, so garment styling, model face, skin tone, hair, and body must be coherent and usable as a reference.",
  ].join(" ");
}

function defaultJobName(now = new Date()) {
  return `Photoshoot ${now.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// One base identity anchor, combined with a single specific pose per call.
function buildVariantBase(modelPrompt: string) {
  return [
    "Photorealistic full-body fashion editorial — one model, one pose per image.",
    GARMENT_GUARDRAIL,
    "Input image 2 is the identity seed: replicate the same face, skin tone, body proportions, hair colour and style, and age exactly — do not drift.",
    `Continue this style direction for lighting, background, and expression: ${modelPrompt}.`,
    "Premium editorial quality. The garment on the model must be pixel-accurate to Input image 1 in every output.",
  ].join(" ");
}

const POSE_DIRECTIONS = [
  "Confident front-facing hero stance, slight weight shift to one hip, looking at camera.",
  "Three-quarter turn to the right — model's right shoulder forward, face in three-quarter profile showing the right side of the garment clearly.",
  "Full back view — model facing directly away from camera, shoulders square, revealing the complete rear of the garment.",
  "Relaxed front-facing pose with a slight body lean, one hand naturally resting.",
  "Dynamic mid-stride walking pose, front-facing, natural arm movement.",
] as const;

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: MESSAGES.common.requestBodyInvalid }, { status: 400 });

  const garmentImageDataUrl = asDataUrlOrThrow(parsed.data.garmentImageDataUrl, MESSAGES.jobs.invalidGarmentImagePayload);
  const modelPrompt = parsed.data.modelPrompt.trim();
  const folderId = parsed.data.folderId;

  const db = getDb();

  // ── Credit check ──────────────────────────────────────────────────────────
  const dbUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
  if (!dbUser) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });
  if (dbUser.credits < CREDITS_PER_JOB) {
    return NextResponse.json({ error: MESSAGES.credits.insufficientCredits }, { status: 402 });
  }

  if (folderId) {
    const folder = await db.query.folders.findFirst({
      where: (f, { and, eq }) => and(eq(f.id, folderId), eq(f.userId, user.id)),
    });
    if (!folder) {
      return NextResponse.json({ error: MESSAGES.common.permissionDenied }, { status: 403 });
    }
  }
  const [job] = await db
    .insert(jobs)
    .values({
      userId: user.id,
      folderId: folderId ?? null,
      name: defaultJobName(),
      status: "running",
      garmentImageDataUrl,
      modelImageDataUrl: modelPrompt,
    })
    .returning({ id: jobs.id });

  let replicateClient: ReturnType<typeof getReplicateClient>;
  try {
    replicateClient = getReplicateClient();
  } catch (e) {
    await db
      .update(jobs)
      .set({
        status: "failed",
        error: e instanceof Error ? e.message : MESSAGES.common.serverConfigIncomplete,
      })
      .where(eq(jobs.id, job.id));
    return NextResponse.json({ id: job.id });
  }

  const sharedInput = {
    input_fidelity: "high" as const,
    quality: "high" as const,
    aspect_ratio: "2:3" as const,
    output_format: "webp" as const,
  };
  const seedPrompt = buildSeedPrompt(modelPrompt);
  const variantBase = buildVariantBase(modelPrompt);

  try {
    // Step 1: seed image — garment + prompt only, no reference photo yet.
    const seedOutput = await replicateClient.run(REPLICATE_MODEL, {
      input: {
        prompt: seedPrompt,
        input_images: [garmentImageDataUrl],
        number_of_images: 1,
        ...sharedInput,
      },
    });
    const seedUrls = await toOutputUrls(seedOutput);
    const seedImageUrl = seedUrls[0];

    if (!seedImageUrl) {
      await db
        .update(jobs)
        .set({ status: "failed", error: MESSAGES.jobs.noOutputImages, updatedAt: new Date() })
        .where(eq(jobs.id, job.id));
      return NextResponse.json({ error: MESSAGES.jobs.noOutputImages }, { status: 500 });
    }

    // Step 2: one parallel call per pose — guarantees one model per output image.
    const variantOutputs = await Promise.all(
      POSE_DIRECTIONS.map((pose) =>
        replicateClient.run(REPLICATE_MODEL, {
          input: {
            prompt: `${variantBase} Pose: ${pose}`,
            input_images: [garmentImageDataUrl, seedImageUrl],
            number_of_images: 1,
            ...sharedInput,
          },
        }),
      ),
    );
    const variantUrls = (
      await Promise.all(variantOutputs.map((out) => toOutputUrls(out)))
    ).map((urls) => urls[0]).filter((u): u is string => typeof u === "string");

    const replicateUrls = [seedImageUrl, ...variantUrls].slice(0, 6);

    let imageUrls: string[];
    try {
      imageUrls = await persistReplicateOutputsToBlob(job.id, replicateUrls);
    } catch (persistErr) {
      const message =
        persistErr instanceof Error ? persistErr.message : MESSAGES.jobs.couldNotFetchOutputForStorage;
      await db
        .update(jobs)
        .set({ status: "failed", error: message, updatedAt: new Date() })
        .where(eq(jobs.id, job.id));
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await db.transaction(async (tx) => {
      await tx.delete(jobOutputs).where(eq(jobOutputs.jobId, job.id));
      if (imageUrls.length > 0) {
        await tx
          .update(jobs)
          .set({ status: "done", error: null, updatedAt: new Date() })
          .where(eq(jobs.id, job.id));
        const POSE_LABELS = ["Seed — Hero Front", "Front", "Right Side", "Back View", "Relaxed Front", "Walking"];
        await tx.insert(jobOutputs).values(
          imageUrls.map((url, idx) => ({
            jobId: job.id,
            variantIndex: idx,
            poseLabel: POSE_LABELS[idx] ?? `Photo Shoot ${idx + 1}`,
            imageUrl: url,
          })),
        );
        // Deduct credit only on success
        await tx.update(users).set({ credits: sql`${users.credits} - ${CREDITS_PER_JOB}` }).where(eq(users.id, user.id));
        await tx.insert(creditTransactions).values({
          userId: user.id,
          amount: -CREDITS_PER_JOB,
          type: "job_deduction",
          description: `Photoshoot — job ${job.id.slice(0, 8)}`,
          stripeSessionId: null,
        });
      } else {
        await tx
          .update(jobs)
          .set({
            status: "failed",
            error: MESSAGES.jobs.noOutputImages,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : MESSAGES.jobs.imageGenerationRequestFailed;
    await db.update(jobs).set({ status: "failed", error: message, updatedAt: new Date() }).where(eq(jobs.id, job.id));
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ id: job.id });
}

