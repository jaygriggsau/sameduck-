import { NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { sha256 } from "@/lib/crypto";
import { createSession } from "@/lib/auth";
import { getSessionSecret } from "@/lib/env";
import { MESSAGES } from "@/lib/messages";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: MESSAGES.common.requestBodyInvalid }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.code;
  const db = getDb();
  let sessionSecret: string;
  try {
    sessionSecret = getSessionSecret();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : MESSAGES.common.serverConfigIncomplete },
      { status: 500 },
    );
  }

  const now = new Date();
  const latest = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), eq(otpCodes.used, false), gt(otpCodes.expiresAt, now)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const otp = latest[0];
  if (!otp) {
    return NextResponse.json({ error: MESSAGES.auth.verificationCodeInvalidOrExpired }, { status: 401 });
  }

  if (otp.attempts >= 8) {
    return NextResponse.json({ error: MESSAGES.auth.tooManyVerificationAttempts }, { status: 429 });
  }

  const expectedHash = sha256(`${email}:${code}:${sessionSecret}`);
  const isValid = expectedHash === otp.codeHash;

  await db
    .update(otpCodes)
    .set({ attempts: otp.attempts + 1, used: isValid ? true : false })
    .where(eq(otpCodes.id, otp.id));

  if (!isValid) {
    return NextResponse.json({ error: MESSAGES.auth.verificationCodeInvalidOrExpired }, { status: 401 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  const user =
    existing ??
    (
      await db.insert(users).values({ email }).returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
    )[0];

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}

