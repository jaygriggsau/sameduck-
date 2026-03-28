import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/db";
import { UserMenu } from "@/components/UserMenu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app");

  const db = getDb();
  const dbUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
  const credits = dbUser?.credits ?? 0;

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 pt-safe backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-safe sm:h-16 sm:gap-4 sm:px-6">
          {/* Logo + nav */}
          <div className="flex items-center gap-6">
            <Link href="/app" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/same-duck-logo.png" alt="Same Duck" className="size-7 rounded-md object-cover" />
              <span className="hidden text-base font-semibold tracking-tight text-zinc-900 min-[420px]:inline">Same Duck</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/app"
                className="focus-ring rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Projects
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Credit balance pill */}
            <Link
              href="/app/credits"
              className="focus-ring hidden items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 sm:flex"
            >
              <span className="size-1.5 rounded-full bg-violet-500" />
              {credits} credit{credits !== 1 ? "s" : ""}
            </Link>
            <Link
              href="/app/credits"
              className="focus-ring touch-min-h inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-semibold text-violet-700 sm:hidden"
            >
              {credits} cr
            </Link>
            <UserMenu email={user.email} />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-safe py-6 min-[390px]:py-7 min-[430px]:max-sm:py-8 sm:px-6 sm:py-9">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 bg-white px-safe py-5 pb-safe sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/same-duck-logo.png" alt="Same Duck" className="size-4 rounded object-cover" />
            <span className="text-xs font-semibold text-zinc-500">Same Duck</span>
          </div>
          <div className="text-xs text-zinc-400">AI fashion photoshoots</div>
        </div>
      </footer>
    </div>
  );
}
