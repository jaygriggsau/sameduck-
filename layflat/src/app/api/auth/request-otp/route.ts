import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { otpCodes } from "@/db/schema";
import { randomNumericCode, sha256 } from "@/lib/crypto";
import { getResendEnv, getSessionSecret } from "@/lib/env";
import { MESSAGES } from "@/lib/messages";
import { getResendClient } from "@/lib/resend";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: MESSAGES.common.requestBodyInvalid }, { status: 400 });
  }

  const { email } = parsed.data;
  const db = getDb();

  try {
    const { RESEND_FROM_EMAIL } = getResendEnv();
    const SESSION_SECRET = getSessionSecret();
    const code = randomNumericCode(6);
    const codeHash = sha256(`${email.toLowerCase()}:${code}:${SESSION_SECRET}`);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await db.insert(otpCodes).values({ email: email.toLowerCase(), codeHash, expiresAt });

    const resend = getResendClient();
    const sendResult = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Your Same Duck login code",
      html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6">
        <p style="font-weight:600;font-size:16px">Same Duck</p>
        <p>Your one-time sign-in code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 3px">${code}</p>
        <p>This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>
    `,
    });
    if ("error" in sendResult && sendResult.error) {
      throw new Error(sendResult.error.message || MESSAGES.auth.emailProviderCouldNotSendVerificationCode);
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : MESSAGES.auth.couldNotSendVerificationCode },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

