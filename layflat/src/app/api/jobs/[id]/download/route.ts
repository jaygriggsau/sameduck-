import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import JSZip from "jszip";

import { getDb } from "@/db";
import { jobOutputs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
    .select({
      variantIndex: jobOutputs.variantIndex,
      poseLabel: jobOutputs.poseLabel,
      imageUrl: jobOutputs.imageUrl,
    })
    .from(jobOutputs)
    .where(eq(jobOutputs.jobId, id))
    .orderBy(jobOutputs.variantIndex);

  if (outputs.length === 0) {
    return NextResponse.json({ error: MESSAGES.jobs.noOutputImages }, { status: 400 });
  }

  const zip = new JSZip();
  for (const o of outputs) {
    try {
      const res = await fetch(o.imageUrl);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const label = safeName(o.poseLabel ?? `photo-shoot-${o.variantIndex + 1}`) || `image-${o.variantIndex + 1}`;
      zip.file(`${o.variantIndex + 1}-${label}.webp`, buf);
    } catch {
      // Skip any failed image URL; include what we can.
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "uint8array" });
  const filename = `same-duck-${id.slice(0, 8)}.zip`;

  const body = Buffer.from(zipBuffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

