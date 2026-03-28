import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { jobs, jobOutputs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const job = await db.query.jobs.findFirst({
    where: (j, { and, eq }) => and(eq(j.id, id), eq(j.userId, user.id)),
  });
  if (!job) return NextResponse.json({ error: MESSAGES.common.jobNotFound }, { status: 404 });

  const outputs = await db
    .select()
    .from(jobOutputs)
    .where(eq(jobOutputs.jobId, id))
    .orderBy(jobOutputs.variantIndex);

  return NextResponse.json({
    id: job.id,
    name: job.name,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    modelPrompt: job.modelImageDataUrl,
    error: job.error,
    outputs: outputs.map((o) => ({
      variantIndex: o.variantIndex,
      poseLabel: o.poseLabel ?? `Photo Shoot ${o.variantIndex + 1}`,
      imageUrl: o.imageUrl,
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: MESSAGES.common.requestBodyInvalid }, { status: 400 });

  const db = getDb();
  const job = await db.query.jobs.findFirst({
    where: (j, { and, eq }) => and(eq(j.id, id), eq(j.userId, user.id)),
  });
  if (!job) return NextResponse.json({ error: MESSAGES.common.jobNotFound }, { status: 404 });

  const [updated] = await db
    .update(jobs)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(jobs.id, id))
    .returning({ id: jobs.id, name: jobs.name });

  return NextResponse.json({ job: updated });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const job = await db.query.jobs.findFirst({
    where: (j, { and, eq }) => and(eq(j.id, id), eq(j.userId, user.id)),
  });
  if (!job) return NextResponse.json({ error: MESSAGES.common.jobNotFound }, { status: 404 });

  await db.delete(jobs).where(eq(jobs.id, id));
  return NextResponse.json({ ok: true });
}

