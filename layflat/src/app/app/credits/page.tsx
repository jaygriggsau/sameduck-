"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BONUS_PCT, CREDIT_PACKS, SUBSCRIPTION_PLANS, isActiveSub } from "@/lib/credits";

type HistoryEntry = { id: string; amount: number; type: string; description: string; createdAt: string };

type CreditData = {
  credits: number;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  history: HistoryEntry[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function CheckIcon() {
  return (
    <svg className="size-4 shrink-0 text-violet-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
    </svg>
  );
}

function CreditsPageInner() {
  const searchParams = useSearchParams();
  const justPurchased = searchParams.get("success") === "1";

  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d: CreditData) => setData(d))
      .catch(() => setError("Could not load credit balance."))
      .finally(() => setLoading(false));
  }, []);

  async function startCheckout(type: "pack" | "subscription", id: string) {
    setCheckoutLoading(id);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(type === "pack" ? { type: "pack", packId: id } : { type: "subscription", planId: id }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Could not start checkout.");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setCheckoutLoading(null);
    }
  }

  const isSubscriber = isActiveSub(data?.subscriptionStatus);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="reveal-up">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Credits</h1>
      </div>

      {/* Success banner */}
      {justPurchased && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-emerald-600">✓</span>
          <p className="text-sm font-medium text-emerald-800">Payment successful — your credits have been added.</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Balance card */}
      <div className="surface-card reveal-up flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-100">
          <span className="text-2xl font-bold text-violet-700">
            {loading ? "–" : (data?.credits ?? 0)}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-500">Available credits</div>
          <div className="mt-0.5 text-xs text-zinc-400">1 credit = 1 photoshoot (6 images)</div>
        </div>
        {isSubscriber && (
          <div className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 sm:ml-auto">
            <span className="size-1.5 rounded-full bg-violet-500" />
            {data?.subscriptionPlan
              ? `${data.subscriptionPlan.charAt(0).toUpperCase()}${data.subscriptionPlan.slice(1)} subscriber`
              : "Active subscriber"}
          </div>
        )}
      </div>

      {/* Credit packs */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Credit Packs <span className="ml-1 text-xs font-normal text-zinc-400">One-time purchase</span></h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(CREDIT_PACKS).map((pack) => {
            const finalCredits = pack.grantedCredits;
            const bonus = finalCredits - pack.credits;
            const isBusy = checkoutLoading === pack.id;
            return (
              <div
                key={pack.id}
                className={`surface-card surface-card-hover relative flex flex-col p-5 ${
                  "badge" in pack ? "border-violet-300 ring-1 ring-violet-200" : "border-zinc-200"
                }`}
              >
                {"badge" in pack && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {pack.badge}
                  </span>
                )}
                <div className="text-sm font-semibold text-zinc-900">{pack.name}</div>
                <div className="mt-1 text-xs text-zinc-400">{pack.description}</div>
                <div className="mt-4 text-3xl font-bold text-zinc-900">{pack.displayPrice}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-zinc-900">{finalCredits}</span>
                  <span className="text-sm text-zinc-500">credits</span>
                  {bonus > 0 && (
                    <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                      +{bonus} bonus
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-zinc-400">{pack.pricePerShoot} per photoshoot</div>
                <button
                  type="button"
                  onClick={() => startCheckout("pack", pack.id)}
                  disabled={!!checkoutLoading}
                  className="focus-ring touch-min-h mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:h-10"
                >
                  {isBusy ? <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Buy now"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subscription plans */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-zinc-900">Monthly Plans</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Credits refresh every month. The highest plan includes a {BONUS_PCT}% credit bonus.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
            const isCurrent = data?.subscriptionPlan === plan.id && isSubscriber;
            const isBusy = checkoutLoading === plan.id;
            const planBonus = plan.grantedMonthlyCredits - plan.monthlyCredits;
            return (
              <div
                key={plan.id}
                className={`surface-card surface-card-hover relative flex flex-col p-5 ${
                  "badge" in plan ? "border-violet-300 ring-1 ring-violet-200" : "border-zinc-200"
                }`}
              >
                {"badge" in plan && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Current plan
                  </span>
                )}
                <div className="text-sm font-semibold text-zinc-900">{plan.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">{plan.displayPrice}</span>
                  <span className="text-sm text-zinc-400">/month</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{plan.description}</div>
                <ul className="mt-4 space-y-1.5">
                  <li className="flex items-center gap-2 text-xs text-zinc-600">
                    <CheckIcon />{plan.grantedMonthlyCredits} credits / month
                  </li>
                  <li className="flex items-center gap-2 text-xs text-zinc-600">
                    <CheckIcon />{planBonus > 0 ? `Includes ${BONUS_PCT}% bonus credits` : "No bonus credits"}
                  </li>
                  <li className="flex items-center gap-2 text-xs text-zinc-600">
                    <CheckIcon />Cancel anytime
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => startCheckout("subscription", plan.id)}
                  disabled={!!checkoutLoading || isCurrent}
                  className={`focus-ring touch-min-h mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium disabled:opacity-50 sm:h-10 ${
                    isCurrent
                      ? "border border-zinc-200 bg-white text-zinc-400"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {isBusy ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : isCurrent ? (
                    "Active"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction history */}
      {data?.history && data.history.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Transaction History</h2>
          <div className="surface-card overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {data.history.map((t) => (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3 sm:items-center sm:px-6">
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    t.amount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-800">{t.description}</div>
                    <div className="text-xs text-zinc-400">{formatDate(t.createdAt)}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    {t.type.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense>
      <CreditsPageInner />
    </Suspense>
  );
}
