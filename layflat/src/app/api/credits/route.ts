import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { creditTransactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const db = getDb();
  const dbUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
  if (!dbUser) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const history = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(20);

  return NextResponse.json({
    credits: dbUser.credits,
    subscriptionStatus: dbUser.subscriptionStatus,
    subscriptionPlan: dbUser.subscriptionPlan,
    history: history.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
