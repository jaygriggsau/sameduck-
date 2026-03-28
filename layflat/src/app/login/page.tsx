import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex flex-1 items-center justify-center bg-zinc-50 text-sm text-zinc-600">Loading…</div>}
    >
      <LoginClient />
    </Suspense>
  );
}

