import Link from "next/link";
import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { jobOutputs, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();
  const db = getDb();

  const [jobsResult, photosResult] = await Promise.all([
    db
      .select({ value: sql<number>`cast(count(*) as integer)` })
      .from(jobs)
      .where(eq(jobs.userId, user.id)),
    db
      .select({ value: sql<number>`cast(count(*) as integer)` })
      .from(jobOutputs)
      .innerJoin(jobs, eq(jobOutputs.jobId, jobs.id))
      .where(eq(jobs.userId, user.id)),
  ]);

  const totalJobs = jobsResult[0]?.value ?? 0;
  const totalPhotos = photosResult[0]?.value ?? 0;
  const initials = user.email.slice(0, 2).toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/app" className="font-medium text-zinc-400 hover:text-zinc-700">
          Dashboard
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-medium text-zinc-900">Profile</span>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zinc-900">{user.email}</h1>
            <p className="mt-1 text-sm text-zinc-500">Member since {memberSince}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-zinc-900">{totalJobs}</div>
          <div className="mt-1 text-sm font-medium text-zinc-500">Photoshoot jobs created</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-zinc-900">{totalPhotos}</div>
          <div className="mt-1 text-sm font-medium text-zinc-500">Photos generated</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-zinc-900">
            {totalJobs > 0 ? Math.round((totalPhotos / totalJobs) * 10) / 10 : 0}
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-500">Avg photos per job</div>
        </div>
      </div>

      {/* Account details */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Account Details</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-500">Email</span>
            <span className="text-sm font-medium text-zinc-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-500">Authentication</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Email OTP
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-500">Member since</span>
            <span className="text-sm font-medium text-zinc-900">{memberSince}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-500">Account ID</span>
            <span className="font-mono text-xs text-zinc-400">{user.id}</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-red-700">Sign Out</h3>
        <p className="mt-1 text-xs text-zinc-500">
          You&apos;ll need to verify your email again to sign back in.
        </p>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Sign out of Same Duck
          </button>
        </form>
      </div>
    </div>
  );
}
