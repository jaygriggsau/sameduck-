import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { folders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      id: folders.id,
      name: folders.name,
      createdAt: folders.createdAt,
    })
    .from(folders)
    .where(eq(folders.userId, user.id))
    .orderBy(desc(folders.createdAt));

  return NextResponse.json({ folders: rows });
}

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.code === "too_big") {
      return NextResponse.json({ error: MESSAGES.folders.folderNameTooLong }, { status: 400 });
    }
    return NextResponse.json({ error: MESSAGES.folders.folderNameRequired }, { status: 400 });
  }

  const db = getDb();
  try {
    const [folder] = await db
      .insert(folders)
      .values({
        userId: user.id,
        name: parsed.data.name,
      })
      .returning({
        id: folders.id,
        name: folders.name,
        createdAt: folders.createdAt,
      });

    return NextResponse.json({ folder });
  } catch {
    return NextResponse.json({ error: MESSAGES.folders.couldNotCreateFolder }, { status: 500 });
  }
}

