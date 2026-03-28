// ── Credit system configuration ───────────────────────────────────────────────

export const CREDITS_PER_JOB = 1;
export const BONUS_PCT = 10; // 10% bonus on highest pack and highest subscription

// One-time credit packs
export const CREDIT_PACKS = {
  pack10: {
    id: "pack10",
    name: "10 Credit Pack",
    credits: 10,
    grantedCredits: 10,
    unitAmount: 1000, // cents
    displayPrice: "$10",
    pricePerShoot: "$1.00",
    description: "Great for testing and small batches",
  },
  pack25: {
    id: "pack25",
    name: "25 Credit Pack",
    credits: 25,
    grantedCredits: 25,
    unitAmount: 2500,
    displayPrice: "$25",
    pricePerShoot: "$1.00",
    description: "Balanced for weekly content needs",
    badge: "Popular",
  },
  pack50: {
    id: "pack50",
    name: "50 Credit Pack",
    credits: 50,
    grantedCredits: 55,
    unitAmount: 5000,
    displayPrice: "$50",
    pricePerShoot: "$0.91",
    description: "Includes 10% bonus credits",
    bonusPct: BONUS_PCT,
  },
} as const;

export type PackId = keyof typeof CREDIT_PACKS;

// Monthly subscription plans — include a recurring credit grant
export const SUBSCRIPTION_PLANS = {
  monthly25: {
    id: "monthly25",
    name: "$25 / month",
    monthlyPrice: 25,
    monthlyCredits: 25,
    grantedMonthlyCredits: 25,
    unitAmount: 2500,
    displayPrice: "$25",
    description: "25 credits refreshed every month",
  },
  monthly50: {
    id: "monthly50",
    name: "$50 / month",
    monthlyPrice: 50,
    monthlyCredits: 50,
    grantedMonthlyCredits: 50,
    unitAmount: 5000,
    displayPrice: "$50",
    description: "50 credits refreshed every month",
  },
  monthly99: {
    id: "monthly99",
    name: "$99 / month",
    monthlyPrice: 99,
    monthlyCredits: 99,
    grantedMonthlyCredits: 109,
    unitAmount: 9900,
    displayPrice: "$99",
    description: "Includes 10% bonus credits",
    bonusPct: BONUS_PCT,
    badge: "Best value",
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

export function isActiveSub(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}
