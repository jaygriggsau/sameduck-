"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MESSAGES } from "@/lib/messages";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = useMemo(() => sp.get("next") || "/app", [sp]);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          body && typeof body === "object" ? (body as Record<string, unknown>).error : undefined;
        throw new Error(typeof msg === "string" ? msg : MESSAGES.auth.couldNotSendVerificationCode);
      }
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          body && typeof body === "object" ? (body as Record<string, unknown>).error : undefined;
        throw new Error(typeof msg === "string" ? msg : MESSAGES.auth.couldNotVerifyCode);
      }
      router.replace(nextUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1">
      {/* Left panel – marketing */}
      <div className="hidden flex-1 flex-col justify-between bg-zinc-900 p-10 lg:flex">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Same Duck home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/same-duck-logo.png"
            alt="Same Duck"
            className="h-10 w-auto max-w-[11rem] object-contain brightness-110"
          />
        </Link>
        <div className="max-w-sm space-y-4">
          <h2 className="text-3xl font-bold leading-tight text-white">
            One Garment Photo. Six Studio-Quality Shots.
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Upload a flat lay, configure your model with simple dropdowns, and Same Duck generates a seed image plus five
            consistent pose variations — ready to review in minutes.
          </p>
          <div className="flex flex-col gap-2 pt-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-violet-500" />
              No password — email OTP only
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-violet-500" />
              Your jobs and folders stay private
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-violet-500" />
              Free to start, no credit card
            </div>
          </div>
        </div>
        <div className="text-xs text-zinc-600">© {new Date().getFullYear()} Same Duck</div>
      </div>

      {/* Right panel – form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-safe pb-safe pt-safe py-6 min-[390px]:py-8 sm:px-8 sm:py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Same Duck home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/same-duck-logo.png"
                alt="Same Duck"
                className="h-10 w-auto max-w-[11rem] object-contain"
              />
            </Link>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
              ← Back
            </Link>
          </div>

          <div className="surface-card p-5 sm:p-7">
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {step === "request" ? "Sign In" : "Check Your Inbox"}
              </h1>
              <p className="text-sm text-zinc-500">
                {step === "request"
                  ? "Enter your email — we'll send a one-time code. No password needed."
                  : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">Email address</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@company.com"
                  className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:bg-white"
                  disabled={loading || step === "verify"}
                  autoComplete="email"
                  onKeyDown={(e) => e.key === "Enter" && step === "request" && !loading && email && requestOtp()}
                />
              </label>

              {step === "verify" && (
                <label className="block">
                  <span className="text-xs font-medium text-zinc-600">Verification code</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="000000"
                    className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-lg font-mono tracking-[0.35em] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-violet-400 focus:bg-white"
                    disabled={loading}
                    autoComplete="one-time-code"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && !loading && code.length === 6 && verifyOtp()}
                  />
                </label>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              {step === "request" ? (
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={loading || !email}
                  className="focus-ring h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
                >
                  {loading ? "Sending code…" : "Send code →"}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading || code.length !== 6}
                    className="focus-ring h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
                  >
                    {loading ? "Verifying…" : "Verify & continue →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("request"); setCode(""); setError(null); }}
                    disabled={loading}
                    className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Use a different email
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-zinc-400">
            By signing in you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
