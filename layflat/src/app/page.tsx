import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getPublicStats } from "@/lib/publicStats";
import { BONUS_PCT, CREDIT_PACKS, SUBSCRIPTION_PLANS } from "@/lib/credits";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

export default async function Home() {
  const [user, stats] = await Promise.all([getCurrentUser(), getPublicStats()]);
  const fmt = new Intl.NumberFormat("en-US");
  const ctaHref = user ? "/app" : "/login";
  const ctaLabel = user ? "Go to Projects" : "Start for free";

  return (
    <div className="flex min-h-full flex-col bg-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 pt-safe backdrop-blur-sm">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between py-2 min-[430px]:min-h-16 px-safe sm:px-6">
          <div className="flex min-w-0 items-center gap-4 min-[430px]:gap-8">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Same Duck home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/same-duck-logo.png"
                alt="Same Duck"
                className="h-10 w-auto max-w-[11rem] object-contain object-center"
              />
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              <a href="#how-it-works" className="text-sm text-zinc-500 hover:text-zinc-900">How it works</a>
              <a href="#outputs"       className="text-sm text-zinc-500 hover:text-zinc-900">Outputs</a>
              <a href="#pricing"       className="text-sm text-zinc-500 hover:text-zinc-900">Pricing</a>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 min-[430px]:gap-3">
            {user ? (
              <Link href="/app" className="focus-ring touch-min-h inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-700 min-[430px]:h-9 min-[430px]:px-4">
                Projects
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">Sign in</Link>
                <Link href="/login" className="focus-ring touch-min-h inline-flex items-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-700 min-[430px]:h-9 min-[430px]:px-4">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">

        {/* ── Hero ── */}
        <section className="border-b border-zinc-100 bg-gradient-to-b from-violet-50/60 to-white px-safe py-9 min-[390px]:max-[429px]:py-[3.25rem] min-[430px]:max-sm:py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="reveal-up inline-flex max-w-[min(100%,20rem)] flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-violet-700 min-[390px]:max-w-none min-[390px]:px-3 min-[390px]:text-xs min-[430px]:text-xs">
                <span className="size-1.5 shrink-0 rounded-full bg-violet-500" />
                <span className="text-balance">AI fashion photography · 6 editorial images per shoot</span>
              </div>
              <h1 className="reveal-up reveal-delay-1 mt-4 text-[1.625rem] font-bold leading-[1.15] tracking-tight text-zinc-900 min-[390px]:max-[429px]:mt-5 min-[390px]:max-[429px]:text-[2.125rem] min-[430px]:max-sm:mt-5 min-[430px]:max-sm:text-4xl sm:mt-5 sm:text-6xl sm:leading-tight">
                Upload a flat lay.<br />
                <span className="text-violet-600">Get a full editorial shoot.</span>
              </h1>
              <p className="reveal-up reveal-delay-2 mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-500 min-[390px]:mt-5 min-[390px]:text-[1.0625rem] min-[430px]:text-lg">
                Upload your garment, configure the model with simple dropdowns, and Same Duck generates six
                studio-quality images — a hero shot plus five pose variations — in minutes.
              </p>

              {/* Conversion-focused social proof */}
              <div className="mx-auto mt-4 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 min-[390px]:mt-5">
                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-snug text-zinc-600 min-[430px]:px-3 min-[430px]:text-xs">
                  Trusted by DTC Fashion Teams
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-snug text-zinc-600 min-[430px]:px-3 min-[430px]:text-xs">
                  {fmt.format(stats.totalGeneratedPhotos)}+ Images Generated
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-snug text-zinc-600 min-[430px]:px-3 min-[430px]:text-xs">
                  6 Consistent Shots per Upload
                </span>
              </div>

              <div className="mt-6 flex w-full max-w-md flex-col items-stretch gap-3 min-[390px]:mt-8 min-[430px]:max-sm:mx-auto min-[430px]:max-sm:max-w-lg sm:flex-row sm:justify-center">
                <Link href={ctaHref} className="focus-ring attention-glow touch-min-h inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-700 sm:w-auto sm:px-7">
                  {ctaLabel}
                </Link>
                <a href="#how-it-works" className="focus-ring touch-min-h inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:w-auto sm:px-7">
                  See how it works
                </a>
              </div>
              <div className="mx-auto mt-4 max-w-xl rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm">
                <p className="text-sm text-zinc-700">
                  &ldquo;We cut photoshoot turnaround from weeks to same-day launch assets.&rdquo;
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Head of Creative · Fashion E-Commerce Brand
                </p>
              </div>
              <p className="mt-4 text-xs text-zinc-400">Sign in with email — no password, no card required.</p>
            </div>

            {/* Before / after */}
            <div className="reveal-up mx-auto mt-8 max-w-2xl">
              <div className="mb-3 text-center">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Upload vs Result</h3>
              </div>
              <BeforeAfterSlider
                beforeSrc="/before-garment.png"
                afterSrc="/after-photoshoot.png"
                beforeLabel="Garment Upload"
                afterLabel="Generated Result"
              />
            </div>

            {/* Stats */}
            {stats.totalUsers > 0 && (
              <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm min-[390px]:mt-14">
                <div className="px-2 py-4 text-center min-[390px]:px-4 min-[430px]:px-6 min-[430px]:py-5">
                  <div className="text-xl font-bold tabular-nums text-zinc-900 min-[390px]:text-2xl">{fmt.format(stats.totalUsers)}</div>
                  <div className="mt-1 text-[10px] leading-tight text-zinc-500 min-[430px]:text-xs">Brands onboarded</div>
                </div>
                <div className="px-2 py-4 text-center min-[390px]:px-4 min-[430px]:px-6 min-[430px]:py-5">
                  <div className="text-xl font-bold tabular-nums text-zinc-900 min-[390px]:text-2xl">{fmt.format(stats.totalGeneratedPhotos)}</div>
                  <div className="mt-1 text-[10px] leading-tight text-zinc-500 min-[430px]:text-xs">Images generated</div>
                </div>
                <div className="px-2 py-4 text-center min-[390px]:px-4 min-[430px]:px-6 min-[430px]:py-5">
                  <div className="text-xl font-bold tabular-nums text-zinc-900 min-[390px]:text-2xl">6</div>
                  <div className="mt-1 text-[10px] leading-tight text-zinc-500 min-[430px]:text-xs">Images per shoot</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="border-b border-zinc-100 px-safe py-14 min-[390px]:py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How It Works</h2>
              <p className="mt-3 text-base text-zinc-500">
                Four steps from flat lay to a complete editorial image set.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  icon: (
                    <svg className="size-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1 1 0 001 1h16a1 1 0 001-1v-2.5M16 8l-4-4-4 4M12 4v12" />
                    </svg>
                  ),
                  title: "Upload your garment",
                  desc: "A flat lay, hanger shot, or plain product photo. The garment image is the source of truth — colour, cut, and every detail is locked in and preserved across all outputs.",
                },
                {
                  step: "02",
                  icon: (
                    <svg className="size-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  ),
                  title: "Configure the model",
                  desc: "Use simple dropdowns to set height, build, age range, expression, background, and lighting. No free-text prompting — just pick your settings and the AI handles the rest.",
                },
                {
                  step: "03",
                  icon: (
                    <svg className="size-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  ),
                  title: "AI generates the seed",
                  desc: "Your garment plus your model settings produce a hero shot — the seed image. This establishes the model identity, garment styling, and scene that all variation shots are anchored to.",
                },
                {
                  step: "04",
                  icon: (
                    <svg className="size-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  ),
                  title: "Get 5 pose variations",
                  desc: "Five shots are generated in parallel from the seed: front-facing, right side, full back view, relaxed pose, and a walking shot. Click any image to open the full-size lightbox and download.",
                },
              ].map((s) => (
                <div key={s.step} className="surface-card surface-card-hover rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50">
                      {s.icon}
                    </div>
                    <span className="text-xs font-bold tracking-widest text-zinc-300">{s.step}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Outputs ── */}
        <section id="outputs" className="border-b border-zinc-100 bg-zinc-50 px-safe py-14 min-[390px]:py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Six labeled shots, every time
              </h2>
              <p className="mt-3 text-base text-zinc-500">
                One shoot gives you every angle your customers need — front, side, back, and lifestyle — all consistent, all labeled, all ready to use.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Cover every surface",
                  desc: "Front, three-quarter, full back, and two lifestyle angles in a single generation. No reshoots to get the detail view your PDP is missing.",
                },
                {
                  title: "Consistent model across all poses",
                  desc: "Every shot uses the same face, body, and garment styling — anchored to the seed image so your set looks like it came from one shoot, not six separate prompts.",
                },
                {
                  title: "Ready for any channel",
                  desc: "Hero shots for PDPs. Lifestyle angles for social. Back view for size guides. You get the full set in one go — no cherry-picking from a larger batch.",
                },
                {
                  title: "Auto-labeled for handoff",
                  desc: "Every output arrives named and ordered. Drop the folder straight into your design system or share with your team without renaming a single file.",
                },
                {
                  title: "Full-screen lightbox built in",
                  desc: "Click any image to preview at full resolution. Navigate poses with arrow keys, jump via the thumbnail strip, and download without leaving the page.",
                },
                {
                  title: "Organised in your history",
                  desc: "Every shoot is logged with a timestamp and status. Create folders by collection or season and come back to any job at any time.",
                },
              ].map((b) => (
                <div key={b.title} className="surface-card surface-card-hover rounded-2xl p-5">
                  <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-violet-100">
                    <span className="size-2 rounded-full bg-violet-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-b border-zinc-100 px-safe py-14 min-[390px]:py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Everything you need to ship faster
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Garment fidelity guardrails",
                  desc: "Fabric texture, colour, pattern, cut, hardware, stitching — every detail from your uploaded image is locked in and reproduced faithfully across all six shots.",
                },
                {
                  title: "Model configurator",
                  desc: "Height, build, age range, expression, background, and lighting — choose from clear options. No prompt engineering. The AI assembles the right instructions for you.",
                },
                {
                  title: "Seed-anchored consistency",
                  desc: "All five pose variations are generated using the seed image as a reference, keeping the model face, body, and garment styling coherent across the full set.",
                },
                {
                  title: "Lightbox viewer",
                  desc: "Click any image to open full-size. Navigate poses with arrow keys or the thumbnail strip. Download directly without leaving the page.",
                },
                {
                  title: "Folders & job history",
                  desc: "Organise photoshoots by collection or season. Every job is timestamped and searchable with a full status history.",
                },
                {
                  title: "Credits — pay as you go",
                  desc: "1 credit per photoshoot (6 images) and priced at $1 per credit. Buy packs that don't expire, or subscribe monthly. The highest pack and highest subscription include bonus credits.",
                },
              ].map((f) => (
                <div key={f.title} className="surface-card surface-card-hover rounded-2xl p-5">
                  <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-violet-100">
                    <span className="size-2 rounded-full bg-violet-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="border-b border-zinc-100 bg-zinc-50 px-safe py-14 min-[390px]:py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Simple, Transparent Pricing</h2>
              <p className="mt-3 text-base text-zinc-500">
                1 credit = 1 photoshoot = 6 images = $1. Credits never expire. Highest pack and highest subscription include a {BONUS_PCT}% bonus.
              </p>
            </div>

            {/* Packs */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {Object.values(CREDIT_PACKS).map((pack) => (
                <div
                  key={pack.id}
                  className={`surface-card surface-card-hover relative flex flex-col rounded-2xl p-6 ${"badge" in pack ? "border-violet-300 ring-1 ring-violet-200" : "border-zinc-200"}`}
                >
                  {"badge" in pack && (
                    <span className="absolute -top-2.5 left-5 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {(pack as typeof pack & { badge: string }).badge}
                    </span>
                  )}
                  <div className="text-sm font-semibold text-zinc-900">{pack.name}</div>
                  <div className="mt-3 text-3xl font-bold text-zinc-900">{pack.displayPrice}</div>
                  <div className="mt-1 text-sm text-zinc-500">{pack.grantedCredits} credits · {pack.pricePerShoot}/shoot</div>
                  <div className="mt-2 text-xs text-zinc-400">{pack.description}</div>
                  <Link
                    href={ctaHref}
                    className="focus-ring touch-min-h mt-5 inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Buy pack
                  </Link>
                </div>
              ))}
            </div>

            {/* Subscriptions */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                <div
                  key={plan.id}
                  className={`surface-card surface-card-hover relative flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-start sm:justify-between ${"badge" in plan ? "border-violet-300 ring-1 ring-violet-200" : "border-zinc-200"}`}
                >
                  {"badge" in plan && (
                    <span className="absolute -top-2.5 left-5 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {(plan as typeof plan & { badge: string }).badge}
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{plan.name}</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">{plan.displayPrice}<span className="text-sm font-normal text-zinc-400">/mo</span></div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {plan.grantedMonthlyCredits} credits refreshed monthly
                      {plan.grantedMonthlyCredits > plan.monthlyCredits ? ` (${plan.monthlyCredits} + ${plan.grantedMonthlyCredits - plan.monthlyCredits} bonus)` : ""}
                    </div>
                  </div>
                  <Link
                    href={ctaHref}
                    className="focus-ring touch-min-h inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 sm:w-auto"
                  >
                    Subscribe
                  </Link>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              All payments via Stripe. Cancel subscriptions anytime. Pack credits never expire.
            </p>
          </div>
        </section>

        {/* ── Testimonial ── */}
        <section className="border-b border-zinc-100 px-safe py-14 min-[390px]:py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xl font-medium leading-relaxed text-zinc-700 sm:text-2xl">
              &ldquo;We used to spend two weeks organising model shoots for each seasonal drop. With Same Duck we generate
              hero shots the same day the samples arrive.&rdquo;
            </p>
            <div className="mt-6">
              <div className="text-sm font-semibold text-zinc-900">Head of Creative</div>
              <div className="text-xs text-zinc-500">Fashion e-commerce brand</div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-zinc-900 px-safe py-14 min-[390px]:py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your garment. Your model. Ready in minutes.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
              Upload a flat lay, pick your model settings from dropdowns, and get six editorial images — hero front,
              right side, full back view, relaxed, and walking. No studio, no stylist, no wait.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col items-stretch gap-3 min-[390px]:mt-8 min-[430px]:max-sm:mx-auto min-[430px]:max-sm:max-w-lg sm:flex-row sm:justify-center">
              <Link href={ctaHref} className="focus-ring touch-min-h inline-flex w-full items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 sm:w-auto sm:px-7">
                {ctaLabel}
              </Link>
              <a href="#pricing" className="focus-ring touch-min-h inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 px-6 text-sm font-medium text-zinc-300 hover:bg-zinc-800 sm:w-auto sm:px-7">
                View pricing
              </a>
            </div>
            <p className="mt-5 text-xs text-zinc-500">Sign in with email — no password, no card required to start.</p>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 bg-white px-safe pb-safe pt-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/same-duck-logo.png"
              alt="Same Duck"
              className="h-8 w-auto max-w-[9rem] object-contain opacity-90"
            />
          </div>
          <div className="flex max-w-[20rem] flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500 min-[430px]:max-w-none">
            <a href="#how-it-works" className="hover:text-zinc-900">How it works</a>
            <a href="#outputs"       className="hover:text-zinc-900">Outputs</a>
            <a href="#pricing"       className="hover:text-zinc-900">Pricing</a>
            <Link href={ctaHref} className="hover:text-zinc-900">{user ? "Projects" : "Sign in"}</Link>
          </div>
          <div className="text-xs text-zinc-400">© {new Date().getFullYear()} Same Duck</div>
        </div>
      </footer>

    </div>
  );
}
