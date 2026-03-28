import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { jobOutputs, jobs } from "@/db/schema";
import { persistReplicateOutputsToBlob } from "@/lib/blob";
import { MESSAGES } from "@/lib/messages";

type ReplicateWebhookPayload = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: unknown;
};

function coerceOutputUrls(output: unknown): string[] {
  if (!output) return [];
  if (typeof output === "string") return [output];
  if (output && typeof output === "object") {
    const maybe = output as Record<string, unknown>;
    if (typeof maybe.url === "string") return [maybe.url];
    if (typeof maybe.href === "string") return [maybe.href];
  }
  if (Array.isArray(output)) {
    return output
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (typeof obj.url === "string") return obj.url;
          if (typeof obj.href === "string") return obj.href;
        }
        return null;
      })
      .filter((x): x is string => typeof x === "string" && x.length > 0);
  }
  return [];
}

export async function POST(req: Request) {
  const payload = (await req.json().catch(() => null)) as ReplicateWebhookPayload | null;
  if (!payload?.id || !payload.status) {
    return NextResponse.json({ error: MESSAGES.webhook.invalidPayload }, { status: 400 });
  }

  const db = getDb();
  const job = await db.query.jobs.findFirst({
    where: (j, { eq }) => eq(j.replicatePredictionId, payload.id),
  });
  if (!job) return NextResponse.json({ ok: true });

  if (payload.status === "succeeded") {
    const rawUrls = coerceOutputUrls(payload.output).slice(0, 6);
    if (rawUrls.length === 0) {
      await db
        .update(jobs)
        .set({
          status: "failed",
          error: MESSAGES.jobs.webhookNoOutputImages,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));
      return NextResponse.json({ ok: true });
    }

    let imageUrls: string[];
    try {
      imageUrls = await persistReplicateOutputsToBlob(job.id, rawUrls);
    } catch (e) {
      const message = e instanceof Error ? e.message : MESSAGES.jobs.couldNotFetchOutputForStorage;
      await db.update(jobs).set({ status: "failed", error: message, updatedAt: new Date() }).where(eq(jobs.id, job.id));
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await db.transaction(async (tx) => {
      await tx.delete(jobOutputs).where(eq(jobOutputs.jobId, job.id));
      await tx.update(jobs).set({ status: "done", error: null, updatedAt: new Date() }).where(eq(jobs.id, job.id));
      await tx.insert(jobOutputs).values(
        imageUrls.map((url, idx) => ({
          jobId: job.id,
          variantIndex: idx,
          poseLabel: `Photo Shoot ${idx + 1}`,
          imageUrl: url,
        })),
      );
    });
    return NextResponse.json({ ok: true });
  }

  if (payload.status === "failed" || payload.status === "canceled") {
    await db
      .update(jobs)
      .set({
        status: "failed",
        error: typeof payload.error === "string" ? payload.error : MESSAGES.jobs.imageGenerationFailed,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
    return NextResponse.json({ ok: true });
  }

  await db.update(jobs).set({ status: "running", updatedAt: new Date() }).where(eq(jobs.id, job.id));
  return NextResponse.json({ ok: true });
}

