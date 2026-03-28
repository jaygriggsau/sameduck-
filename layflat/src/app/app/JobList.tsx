"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MESSAGES } from "@/lib/messages";

export type JobRow = {
  id: string;
  name?: string | null;
  seedImageUrl?: string | null;
  folderId: string | null;
  status: string;
  createdAt: string;
};

type Props = {
  initialJobs: JobRow[];
  folderNameById: Record<string, string>;
};

function formatJobName(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  running: "bg-violet-100 text-violet-700",
  queued: "bg-zinc-100 text-zinc-600",
};

function StatusBadge({ status }: { status: string }) {
  const isLive = status === "running" || status === "queued";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {isLive && <span className="inline-block size-1.5 animate-pulse rounded-full bg-violet-500" />}
      {status}
    </span>
  );
}

// ── Checkbox ────────────────────────────────────────────────────────────────
function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate ?? false;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-4 cursor-pointer rounded border-zinc-300 accent-violet-600"
    />
  );
}

// ── Trash icon ───────────────────────────────────────────────────────────────
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 8.5A1 1 0 004.8 13.6h6.4a1 1 0 001-.9L13 4"
      />
    </svg>
  );
}

export function JobList({ initialJobs, folderNameById }: Props) {
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── derived selection state ────────────────────────────────────────────────
  const allSelected = jobs.length > 0 && selected.size === jobs.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll(v: boolean) {
    setSelected(v ? new Set(jobs.map((j) => j.id)) : new Set());
  }

  function toggleOne(id: string, v: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (v) { next.add(id); } else { next.delete(id); }
      return next;
    });
  }

  // ── polling live jobs ──────────────────────────────────────────────────────
  const pollRunning = useCallback(async (currentJobs: JobRow[]) => {
    const liveIds = currentJobs
      .filter((j) => j.status === "running" || j.status === "queued")
      .map((j) => j.id);
    if (liveIds.length === 0) return;

    const updates = await Promise.all(
      liveIds.map(async (id) => {
        try {
          const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
          if (!res.ok) return null;
          const data = (await res.json().catch(() => null)) as { status?: string } | null;
          return data?.status ? { id, status: data.status } : null;
        } catch {
          return null;
        }
      }),
    );

    setJobs((prev) =>
      prev.map((j) => {
        const update = updates.find((u) => u?.id === j.id);
        return update ? { ...j, status: update.status } : j;
      }),
    );
  }, []);

  useEffect(() => {
    const hasLive = jobs.some((j) => j.status === "running" || j.status === "queued");
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (hasLive) pollingRef.current = setInterval(() => pollRunning(jobs), 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [jobs, pollRunning]);

  // ── single delete (row trash icon) ────────────────────────────────────────
  async function deleteOne(id: string) {
    if (!window.confirm("Delete this job and all its generated images?")) return;
    setDeleteError(null);
    setDeletingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(MESSAGES.jobs.couldNotDeleteJob);
      animateRemove([id]);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setDeletingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  // ── bulk delete ───────────────────────────────────────────────────────────
  async function deleteBulk() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} job${ids.length > 1 ? "s" : ""} and all their generated images?`)) return;
    setDeleteError(null);
    setBulkDeleting(true);
    setDeletingIds(new Set(ids));
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/jobs/${id}`, { method: "DELETE" }).then((r) => ({ id, ok: r.ok }))),
      );
      const succeeded = results.filter((r) => r.ok).map((r) => r.id);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        setDeleteError(`${failed.length} job${failed.length > 1 ? "s" : ""} could not be deleted.`);
      }
      if (succeeded.length > 0) animateRemove(succeeded);
      setSelected(new Set());
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setBulkDeleting(false);
      setDeletingIds(new Set());
    }
  }

  // ── animation helper ──────────────────────────────────────────────────────
  function animateRemove(ids: string[]) {
    setRemovingIds((s) => { const n = new Set(s); ids.forEach((id) => n.add(id)); return n; });
    setTimeout(() => {
      setJobs((prev) => prev.filter((j) => !ids.includes(j.id)));
      setRemovingIds((s) => { const n = new Set(s); ids.forEach((id) => n.delete(id)); return n; });
    }, 250);
  }

  // ── empty state ───────────────────────────────────────────────────────────
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
        <div className="text-3xl">📷</div>
        <p className="text-sm font-medium text-zinc-700">No jobs yet</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Upload a garment, configure your model above, and hit Generate to create your first photoshoot.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Bulk action bar ─────────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-2.5 transition-all duration-200 sm:px-6 ${
          selected.size > 0 ? "bg-violet-50" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
            label="Select all jobs"
          />
          <span className="text-xs text-zinc-500">
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </span>
        </div>

        {selected.size > 0 && (
          <button
            type="button"
            onClick={deleteBulk}
            disabled={bulkDeleting}
            className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {bulkDeleting ? (
              <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <TrashIcon className="size-3" />
            )}
            Delete {selected.size}
          </button>
        )}
      </div>

      {deleteError && (
        <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6">
          {deleteError}
        </div>
      )}

      {/* ── Job rows ─────────────────────────────────────────────────────── */}
      <div className="divide-y divide-zinc-100">
        {jobs.map((j) => {
          const isSelected = selected.has(j.id);
          const isDeleting = deletingIds.has(j.id);
          const isRemoving = removingIds.has(j.id);

          return (
            <div
              key={j.id}
              className={`group flex flex-wrap items-start gap-3 px-4 py-3.5 transition-all duration-200 sm:flex-nowrap sm:items-center sm:px-6 ${
                isRemoving ? "translate-x-2 opacity-0" : "opacity-100"
              } ${isDeleting ? "opacity-40" : ""} ${isSelected ? "bg-violet-50/60" : "hover:bg-zinc-50"}`}
            >
              {/* Checkbox */}
              <div className="shrink-0">
                <Checkbox
                  checked={isSelected}
                  onChange={(v) => toggleOne(j.id, v)}
                  label={`Select job ${j.id.slice(0, 8)}`}
                />
              </div>

              {/* Row link */}
              <Link
                href={`/app/jobs/${j.id}`}
                className="focus-ring order-2 flex min-w-0 basis-full items-center gap-3 rounded-lg p-1 text-sm sm:order-none sm:basis-auto sm:flex-1"
              >
                {j.seedImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={j.seedImageUrl}
                    alt="Seed thumbnail"
                    className="size-10 shrink-0 rounded-lg border border-zinc-200 object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                    <svg className="size-4 text-zinc-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="2" y="3" width="12" height="10" rx="1.5" />
                      <path strokeLinecap="round" d="M5 3V1.5M11 3V1.5M2 6.5h12" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-900">{j.name || formatJobName(j.createdAt)}</div>
                  {j.folderId && folderNameById[j.folderId] && (
                    <div className="mt-0.5 truncate text-xs font-medium text-zinc-400">
                      {folderNameById[j.folderId]}
                    </div>
                  )}
                </div>
              </Link>

              {/* Status + single delete */}
              <div className="order-3 ml-7 flex w-[calc(100%-1.75rem)] items-center justify-between gap-2 sm:order-none sm:ml-0 sm:w-auto sm:justify-start">
                <StatusBadge status={j.status} />
                <button
                  type="button"
                  aria-label="Delete job"
                  onClick={() => deleteOne(j.id)}
                  disabled={isDeleting || bulkDeleting}
                  className="focus-ring flex size-7 items-center justify-center rounded-lg text-zinc-300 opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed sm:opacity-0 sm:group-hover:opacity-100"
                >
                  {isDeleting ? (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
                  ) : (
                    <TrashIcon className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export { SkeletonRow };

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="size-8 animate-pulse rounded-lg bg-zinc-100" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
      <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-100" />
    </div>
  );
}
