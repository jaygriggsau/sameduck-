import { Resend } from "resend";
import { getResendEnv } from "@/lib/env";

export function getResendClient() {
  const { RESEND_API_KEY } = getResendEnv();
  return new Resend(RESEND_API_KEY);
}

