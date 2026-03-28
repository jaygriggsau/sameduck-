import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { getSessionSecret } from "@/lib/env";
import { randomToken, sha256 } from "@/lib/crypto";

const SESSION_COOKIE = "lf_session";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let SESSION_SECRET: string;
  try {
    SESSION_SECRET = getSessionSecret();
  } catch {
    return null;
  }
  const tokenHash = sha256(`${token}:${SESSION_SECRET}`);

  const db = getDb();
  const now = new Date();
  const session = await db.query.sessions.findFirst({
    where: (s, { and, eq, gt }) => and(eq(s.tokenHash, tokenHash), gt(s.expiresAt, now)),
  });
  if (!session) return null;

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function createSession(userId: string) {
  const SESSION_SECRET = getSessionSecret();
  const token = randomToken(32);
  const tokenHash = sha256(`${token}:${SESSION_SECRET}`);

  const db = getDb();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14d
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function logout() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  (await cookies()).delete(SESSION_COOKIE);
  if (!token) return;

  const SESSION_SECRET = getSessionSecret();
  const tokenHash = sha256(`${token}:${SESSION_SECRET}`);
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

