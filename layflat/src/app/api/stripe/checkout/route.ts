import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { CREDIT_PACKS, SUBSCRIPTION_PLANS } from "@/lib/credits";
import { getStripeClient } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/env";
import { MESSAGES } from "@/lib/messages";

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pack"), packId: z.enum(["pack10", "pack25", "pack50"]) }),
  z.object({ type: z.literal("subscription"), planId: z.enum(["monthly25", "monthly50", "monthly99"]) }),
]);

async function getOrCreateStripeCustomer(stripe: ReturnType<typeof getStripeClient>, userId: string, email: string, existingCustomerId: string | null | undefined) {
  if (existingCustomerId) return existingCustomerId;
  const customer = await stripe.customers.create({ email, metadata: { sameduck_user_id: userId } });
  await getDb().update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: MESSAGES.common.requestBodyInvalid }, { status: 400 });

  const db = getDb();
  const dbUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
  if (!dbUser) return NextResponse.json({ error: MESSAGES.common.authenticationRequired }, { status: 401 });

  let stripe: ReturnType<typeof getStripeClient>;
  try { stripe = getStripeClient(); } catch {
    return NextResponse.json({ error: MESSAGES.common.serverConfigIncomplete }, { status: 500 });
  }

  const appUrl = getPublicAppUrl();
  const customerId = await getOrCreateStripeCustomer(stripe, user.id, dbUser.email, dbUser.stripeCustomerId);
  const successUrl = `${appUrl}/app/credits?success=1`;
  const cancelUrl = `${appUrl}/app/credits`;

  if (parsed.data.type === "pack") {
    const pack = CREDIT_PACKS[parsed.data.packId];
    const finalCredits = pack.grantedCredits;
    const bonus = finalCredits - pack.credits;
    const bonusNote = bonus > 0 ? ` (+${bonus} bonus)` : "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.unitAmount,
          product_data: {
            name: `${pack.name} — ${finalCredits} credits${bonusNote}`,
            description: `${finalCredits} Same Duck photoshoot credits`,
          },
        },
      }],
      metadata: {
        sameduck_user_id: user.id,
        sameduck_type: "pack",
        sameduck_credits: String(finalCredits),
        sameduck_pack_id: pack.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  }

  // Subscription
  const plan = SUBSCRIPTION_PLANS[parsed.data.planId];
  const planBonus = plan.grantedMonthlyCredits - plan.monthlyCredits;
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: plan.unitAmount,
        recurring: { interval: "month" },
        product_data: {
            name: `Same Duck ${plan.name} — ${plan.grantedMonthlyCredits} credits/month`,
            description: `${plan.grantedMonthlyCredits} credits per month${planBonus > 0 ? ` (${plan.monthlyCredits} + ${planBonus} bonus)` : ""}`,
        },
      },
    }],
    subscription_data: {
      metadata: {
        sameduck_user_id: user.id,
        sameduck_plan_id: plan.id,
        sameduck_monthly_credits: String(plan.grantedMonthlyCredits),
      },
    },
    metadata: {
      sameduck_user_id: user.id,
      sameduck_type: "subscription",
      sameduck_plan_id: plan.id,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: session.url });
}
