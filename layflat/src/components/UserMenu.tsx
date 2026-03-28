"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = email.slice(0, 2).toUpperCase();

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="User menu"
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex size-11 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white ring-2 ring-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-violet-500 sm:size-9"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-xl sm:w-56">
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-zinc-500">Signed in as</div>
            <div className="mt-0.5 truncate text-sm font-medium text-zinc-900">{email}</div>
          </div>
          <div className="mx-1 my-1 border-t border-zinc-100" />
          <Link
            href="/app"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Projects
          </Link>
          <Link
            href="/app/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Profile
          </Link>
          <Link
            href="/app/credits"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-violet-600 hover:bg-violet-50"
          >
            Buy credits
          </Link>
          <div className="mx-1 my-1 border-t border-zinc-100" />
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
