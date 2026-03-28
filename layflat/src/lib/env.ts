import { z } from "zod";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }
  return value;
}

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getSessionSecret() {
  const secret = requireEnv("SESSION_SECRET");
  if (secret.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters.");
  }
  return secret;
}

export function getResendEnv() {
  const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
  const rawFrom = requireEnv("RESEND_FROM_EMAIL").trim();
  const extracted = /<([^>]+)>/.exec(rawFrom)?.[1]?.trim() ?? rawFrom;
  const emailParsed = z.string().email().safeParse(extracted);
  if (!emailParsed.success) {
    throw new Error("RESEND_FROM_EMAIL must contain a valid email address.");
  }
  const RESEND_FROM_EMAIL = rawFrom;
  return { RESEND_API_KEY, RESEND_FROM_EMAIL };
}

export function getReplicateToken() {
  return requireEnv("REPLICATE_API_TOKEN");
}

export function getPublicAppUrl() {
  const url = requireEnv("NEXT_PUBLIC_APP_URL");
  const parsed = z.string().url().safeParse(url);
  if (!parsed.success) {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid URL.");
  }
  return url.replace(/\/$/, "");
}

/** Canonical site URL for metadata / OG; defaults to https://sameduck.com when env is unset. */
export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://sameduck.com";
  const parsed = z.string().url().safeParse(raw);
  return new URL(parsed.success ? parsed.data : "https://sameduck.com");
}

export function getStripeEnv() {
  const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");
  return { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET };
}

