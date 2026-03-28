import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";

import { getDb } from "@/db";
import { creditTransactions, users } from "@/db/schema";
import { getStripeClient } from "@/lib/stripe";
import { getStripeEnv } from "@/lib/env";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/lib/credits";

async function grantCredits(userId: string, amount: number, type: string, description: string, stripeSessionId: string | null) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ credits: sql`${users.credits} + ${amount}` }).where(eq(users.id, userId));
    await tx.insert(creditTransactions).values({ userId, amount, type, description, stripeSessionId });
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const userId = meta.sameduck_user_id;
  if (!userId) return;

  if (meta.sameduck_type === "pack") {
    const credits = parseInt(meta.sameduck_credits ?? "0", 10);
    if (credits > 0) {
      await grantCredits(userId, credits, "pack_purchase", `${meta.sameduck_pack_id ?? "pack"} — ${credits} credits`, session.id);
    }
  }

  if (meta.sameduck_type === "subscription") {
    // Persist subscription details on user record — credits granted on invoice events.
    const planId = meta.sameduck_plan_id as PlanId | undefined;
    const db = getDb();
    await db.update(users).set({
      subscriptionId: session.subscription as string,
      subscriptionPlan: planId ?? null,
      subscriptionStatus: "active",
    }).where(eq(users.id, userId));
  }
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const p = invoice.parent;
  if (p?.type === "subscription_details" && p.subscription_details?.subscription) {
    const sub = p.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  const legacy = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id;
  return null;
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle" && invoice.billing_reason !== "subscription_create") return;

  const stripe = getStripeClient();
  const subId = subscriptionIdFromInvoice(invoice);
  if (!subId) return;

  const sub = await stripe.subscriptions.retrieve(subId);
  const meta = sub.metadata ?? {};
  const userId = meta.sameduck_user_id;
  const monthlyCredits = parseInt(meta.sameduck_monthly_credits ?? "0", 10);
  const planId = meta.sameduck_plan_id;

  if (!userId || monthlyCredits <= 0) return;

  const plan = planId ? SUBSCRIPTION_PLANS[planId as PlanId] : null;
  const label = plan?.name ?? "subscription";
  await grantCredits(userId, monthlyCredits, "subscription_grant", `${label} — monthly grant of ${monthlyCredits} credits`, invoice.id);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.sameduck_user_id;
  if (!userId) return;
  const db = getDb();
  await db.update(users).set({
    subscriptionStatus: sub.status,
    subscriptionId: sub.id,
    subscriptionPlan: sub.metadata?.sameduck_plan_id ?? null,
  }).where(eq(users.id, userId));
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.sameduck_user_id;
  if (!userId) return;
  const db = getDb();
  await db.update(users).set({
    subscriptionStatus: "canceled",
    subscriptionId: null,
    subscriptionPlan: null,
  }).where(eq(users.id, userId));
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let stripe: ReturnType<typeof getStripeClient>;
  let webhookSecret: string;
  try {
    stripe = getStripeClient();
    ({ STRIPE_WEBHOOK_SECRET: webhookSecret } = getStripeEnv());
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
