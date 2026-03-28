import Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";

declare global {
  var __stripeClient: Stripe | undefined;
}

export function getStripeClient(): Stripe {
  if (!globalThis.__stripeClient) {
    const { STRIPE_SECRET_KEY } = getStripeEnv();
    globalThis.__stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return globalThis.__stripeClient;
}
