"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MESSAGES } from "@/lib/messages";

type Output = { variantIndex: number; poseLabel?: string; imageUrl: string };
type JobResponse = {
  id: string;
  name?: string | null;
  status: string;
  createdAt?: string;
  modelPrompt?: string;
  error?: string | null;
  outputs: Output[];
}

function formatJobName(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function readJsonSafely(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function isJobResponse(x: unknown): x is JobResponse {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.status === "string" && Array.isArray(r.outputs);
}

const STATUS_PILL: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  running: "bg-violet-100 text-violet-700",
  queued: "bg-zinc-100 text-zinc-600",
};

// ── Lightbox ─────────────────────────────────────────────────────────────────
type LightboxProps = {
  outputs: Output[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function Lightbox({ outputs, activeIndex, onClose, onPrev, onNext }: LightboxProps) {
  const o = outputs[activeIndex];
  const label = o?.poseLabel ?? `Photo Shoot ${(o?.variantIndex ?? 0) + 1}`;
  const isSeed = o?.variantIndex === 0;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < outputs.length - 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!o) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Card — stop propagation so clicking the image doesn't close */}
      <div
        className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">{label}</span>
            {isSeed && (
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Seed
              </span>
            )}
            <span className="text-xs text-zinc-400">
              {activeIndex + 1} / {outputs.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={o.imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              title="Download image"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v9m0 0l-3-3m3 3l3-3M2 13h12" />
              </svg>
              Save
            </a>
            <button
              type="button"
              aria-label="Close lightbox"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <svg className="size-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative flex-1 overflow-hidden bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={o.imageUrl}
            src={o.imageUrl}
            alt={label}
            className="max-h-[70vh] w-full object-contain"
          />

          {/* Prev / Next arrows */}
          {hasPrev && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={onPrev}
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            >
              <svg className="size-4 text-zinc-700" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L6 8l4 5" />
              </svg>
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              aria-label="Next image"
              onClick={onNext}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            >
              <svg className="size-4 text-zinc-700" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l4 5-4 5" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-zinc-100 bg-white p-2">
          {outputs.map((thumb, idx) => (
            <button
              key={thumb.variantIndex}
              type="button"
              aria-label={`Go to ${thumb.poseLabel ?? `Photo Shoot ${thumb.variantIndex + 1}`}`}
              onClick={() => {
                // navigate to thumb index via onPrev/onNext chain isn't practical
                // so we pass a direct setter instead — handled below via lightboxIndex setter
                (window as unknown as { __lbSet?: (i: number) => void }).__lbSet?.(idx);
              }}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                idx === activeIndex ? "border-violet-500" : "border-transparent hover:border-zinc-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.imageUrl}
                alt={thumb.poseLabel ?? `Photo Shoot ${thumb.variantIndex + 1}`}
                className="h-14 w-10 object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isDone = useMemo(() => job?.status === "done" || job?.status === "failed", [job?.status]);

  // Expose direct setter for thumbnail strip navigation inside Lightbox
  useEffect(() => {
    (window as unknown as { __lbSet?: (i: number) => void }).__lbSet = setLightboxIndex;
    return () => { delete (window as unknown as { __lbSet?: (i: number) => void }).__lbSet; };
  }, []);

  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const nextImage = useCallback(
    () => setLightboxIndex((i) => (i !== null && job?.outputs && i < job.outputs.length - 1 ? i + 1 : i)),
    [job?.outputs],
  );

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        const raw = await readJsonSafely(res);
        if (!res.ok) {
          const err = raw && typeof raw === "object" ? (raw as Record<string, unknown>).error : undefined;
          throw new Error(typeof err === "string" ? err : MESSAGES.jobs.couldNotLoadJobDetails);
        }
        if (!isJobResponse(raw)) throw new Error(MESSAGES.jobs.invalidJobResponseFormat);
        if (!cancelled) { setJob(raw); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
      }
    }
    tick();
    if (isDone) return () => void 0;
    const t = window.setInterval(tick, 2000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [id, isDone]);

  async function deleteJob() {
    if (deleting) return;
    if (!window.confirm("Delete this job and all generated outputs?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(MESSAGES.jobs.couldNotDeleteJob);
      window.location.href = "/app";
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
      setDeleting(false);
    }
  }

  async function downloadAll() {
    if (!job?.outputs?.length || downloadingAll) return;
    setDownloadingAll(true);
    setError(null);
    try {
      for (const o of job.outputs) {
        const label = (o.poseLabel ?? `Photo Shoot ${o.variantIndex + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const fileName = `same-duck-${id.slice(0, 8)}-${o.variantIndex + 1}-${label || "image"}.webp`;
        try {
          const res = await fetch(o.imageUrl);
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Fallback when blob download is blocked by remote policies.
          const a = document.createElement("a");
          a.href = o.imageUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        // Small delay helps browsers process multiple downloads.
        await new Promise((r) => setTimeout(r, 120));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setDownloadingAll(false);
    }
  }

  async function downloadZip() {
    if (!job?.outputs?.length || downloadingZip) return;
    setDownloadingZip(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}/download`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || MESSAGES.common.requestFailed);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `same-duck-${id.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setDownloadingZip(false);
    }
  }

  async function saveName() {
    if (!job || !nameDraft.trim() || savingName) return;
    setSavingName(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { job?: { name?: string | null }; error?: string } | null;
      if (!res.ok) throw new Error(data?.error || MESSAGES.common.requestFailed);
      setJob((prev) => (prev ? { ...prev, name: data?.job?.name ?? nameDraft.trim() } : prev));
      setEditingName(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="reveal-up flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/app" className="font-medium text-zinc-400 hover:text-zinc-700">
            Projects
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-medium text-zinc-900">
            {job?.name || (job?.createdAt ? formatJobName(job.createdAt) : "Photoshoot")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={deleteJob}
            disabled={deleting}
            className="focus-ring inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:flex-none"
          >
            {deleting ? "Deleting…" : "Delete job"}
          </button>
          <Link
            href="/app"
            className="focus-ring inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-none"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Status card */}
      <div className="surface-card p-4 min-[390px]:p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {editingName ? (
            <div className="flex flex-wrap items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={120}
                  title="Job name"
                  placeholder="Job name"
                  className="focus-ring h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:max-w-sm"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName || !nameDraft.trim()}
                  className="focus-ring inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setNameDraft(job?.name || (job?.createdAt ? formatJobName(job.createdAt) : "Photoshoot")); }}
                  disabled={savingName}
                  className="focus-ring inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[1.375rem] font-semibold leading-tight tracking-tight text-zinc-900 min-[390px]:text-2xl">
                  {job?.name || (job?.createdAt ? formatJobName(job.createdAt) : "Photoshoot")}
                </h1>
                <button
                  type="button"
                  onClick={() => { setEditingName(true); setNameDraft(job?.name || (job?.createdAt ? formatJobName(job.createdAt) : "Photoshoot")); }}
                  className="focus-ring inline-flex h-7 items-center rounded-lg border border-zinc-200 px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Rename
                </button>
              </div>
            )}
          </div>
          <div
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[job?.status ?? ""] ?? "bg-zinc-100 text-zinc-600"}`}
          >
            {job?.status ?? "loading…"}
          </div>
        </div>
        {job?.error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {job.error}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {!isDone && (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-violet-500" />
            Generating — refreshing every 2 seconds…
          </div>
        )}
      </div>

      {/* Model + shoot settings */}
      {job?.modelPrompt && (
        <div className="surface-card p-4 min-[390px]:p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Model &amp; Shoot Settings</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Saved setup used to generate this photoshoot.
          </p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-700">
            {job.modelPrompt}
          </pre>
        </div>
      )}

      {/* Outputs */}
      <div className="surface-card">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Photoshoot Results</h2>
          </div>
          <div className="flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-center">
            <button
              type="button"
              onClick={downloadZip}
              disabled={!job?.outputs?.length || downloadingZip}
              className="focus-ring touch-min-h inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 min-[430px]:h-9 min-[430px]:w-auto"
            >
              {downloadingZip ? (
                <span className="size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
              ) : (
                <svg className="size-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h10v8H3zM6 2.5h4M8 8v3m0 0l-1.5-1.5M8 11l1.5-1.5" />
                </svg>
              )}
              Download ZIP
            </button>
            <button
              type="button"
              onClick={downloadAll}
              disabled={!job?.outputs?.length || downloadingAll}
              className="focus-ring touch-min-h inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 min-[430px]:h-9 min-[430px]:w-auto"
            >
              {downloadingAll ? (
                <span className="size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
              ) : (
                <svg className="size-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0l-3-3m3 3l3-3M2 13h12" />
                </svg>
              )}
              Download all
            </button>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-sm font-medium text-zinc-500">
              {job?.outputs?.length ?? 0} / 6
            </div>
          </div>
        </div>

        {job?.outputs?.length ? (
          <div className="grid gap-px bg-zinc-100 sm:grid-cols-2 lg:grid-cols-3 rounded-b-2xl overflow-hidden">
            {job.outputs.map((o, idx) => {
              const label = o.poseLabel ?? `Photo Shoot ${o.variantIndex + 1}`;
              const isSeed = o.variantIndex === 0;
              return (
                <button
                  key={o.variantIndex}
                  type="button"
                  onClick={() => openLightbox(idx)}
                    className="group relative bg-white text-left transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.imageUrl}
                    alt={isSeed ? `${label} — seed image` : label}
                    className="aspect-[2/3] w-full object-cover transition-opacity duration-200 group-hover:opacity-80"
                  />
                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      View
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-xs font-medium text-zinc-700">{label}</span>
                      {isSeed && (
                        <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                          Seed
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400 group-hover:text-violet-600">↗ View</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            {isDone ? (
              <>
                <div className="text-2xl">⚠️</div>
                <p className="text-sm font-medium text-zinc-700">No outputs were returned</p>
                <p className="text-xs text-zinc-400">Try a clearer garment image or a more specific prompt.</p>
              </>
            ) : (
              <>
                <div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-violet-600" />
                <p className="text-xs text-zinc-500">Generating your photoshoot…</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && job?.outputs && (
        <Lightbox
          outputs={job.outputs}
          activeIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}
