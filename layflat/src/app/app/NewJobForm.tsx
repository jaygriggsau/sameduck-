"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MESSAGES } from "@/lib/messages";

const STEPS = [
  { label: "Processing garment image…", maxMs: 4_000 },
  { label: "Generating seed image…", maxMs: 30_000 },
  { label: "Creating pose variations…", maxMs: 90_000 },
  { label: "Almost done…", maxMs: Infinity },
] as const;

function GeneratingIndicator() {
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const ms = Date.now() - startRef.current;
      setElapsed(ms);
      let idx = 0;
      let acc = 0;
      for (let i = 0; i < STEPS.length; i++) {
        acc += STEPS[i].maxMs;
        if (ms < acc) { idx = i; break; }
        idx = i;
      }
      setStepIdx(idx);
    }, 400);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // rough progress: clamp 0–95% so it never hits 100 while still loading
  const maxMs = STEPS.slice(0, STEPS.length - 1).reduce((a, s) => a + s.maxMs, 0);
  const progress = Math.min(95, (elapsed / maxMs) * 100);

  return (
    <div className="mt-4 space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-violet-500" />
        <span>
          Step {stepIdx + 1}/{STEPS.length} — {STEPS[stepIdx].label}
        </span>
      </div>
    </div>
  );
}

async function fileToDataUrl(file: File, maxEdge = 1024, quality = 0.9): Promise<string> {
  const img = document.createElement("img");
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(MESSAGES.uploads.invalidImageFile));
      img.src = objectUrl;
    });

    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(MESSAGES.uploads.browserCouldNotProcessImage);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

type FolderOption = {
  id: string;
  name: string;
};
type NewJobFormProps = {
  initialFolders: FolderOption[];
  lockedFolderId?: string;
  lockedFolderName?: string;
};

// ── Model builder options ────────────────────────────────────────────────────
const HEIGHT_OPTIONS = [
  { value: "petite (5′2″–5′5″)", label: "Petite  5′2″–5′5″" },
  { value: "average height (5′6″–5′8″)", label: "Average  5′6″–5′8″" },
  { value: "tall (5′9″–5′11″)", label: "Tall  5′9″–5′11″" },
  { value: "very tall (6′+)", label: "Very Tall  6′+" },
];

const BUILD_OPTIONS = [
  { value: "slim / lean build", label: "Slim / Lean" },
  { value: "athletic build", label: "Athletic" },
  { value: "curvy build", label: "Curvy" },
  { value: "plus-size build", label: "Plus-Size" },
  { value: "muscular build", label: "Muscular" },
];

const EXPRESSION_OPTIONS = [
  { value: "neutral expression", label: "Neutral" },
  { value: "confident editorial expression", label: "Confident / Editorial" },
  { value: "soft smiling expression", label: "Soft Smile" },
  { value: "serious, intense expression", label: "Serious / Intense" },
  { value: "relaxed, natural expression", label: "Relaxed / Natural" },
];

const BACKGROUND_OPTIONS = [
  { value: "clean white studio background", label: "White Studio" },
  { value: "soft off-white seamless backdrop", label: "Off-White Seamless" },
  { value: "light grey seamless studio", label: "Light Grey Studio" },
  { value: "dark / black studio background", label: "Dark Studio" },
  { value: "outdoor natural environment, soft daylight", label: "Outdoor Natural" },
  { value: "minimalist urban street backdrop", label: "Urban Street" },
];

const LIGHTING_OPTIONS = [
  { value: "soft key light", label: "Soft Key Light" },
  { value: "natural diffused light", label: "Natural / Diffused" },
  { value: "dramatic side lighting", label: "Dramatic Side" },
  { value: "bright even studio lighting", label: "Bright & Even" },
  { value: "warm golden-hour light", label: "Golden Hour" },
];

const AGE_OPTIONS = [
  { value: "newborn baby (0–12 months)", label: "Baby  0–12 months" },
  { value: "toddler (1–3 years old)", label: "Toddler  1–3 yrs" },
  { value: "young child (4–7 years old)", label: "Child  4–7 yrs" },
  { value: "older child (8–12 years old)", label: "Child  8–12 yrs" },
  { value: "teenager (13–17 years old)", label: "Teen  13–17 yrs" },
  { value: "early 20s", label: "Early 20s" },
  { value: "mid 20s", label: "Mid 20s" },
  { value: "late 20s", label: "Late 20s" },
  { value: "early 30s", label: "Early 30s" },
  { value: "mid 30s", label: "Mid 30s" },
  { value: "late 30s", label: "Late 30s" },
  { value: "early 40s", label: "Early 40s" },
  { value: "mid 40s–50s", label: "Mid 40s–50s" },
  { value: "50s–60s", label: "50s–60s" },
];

function buildModelPrompt(opts: {
  height: string;
  build: string;
  age: string;
  expression: string;
  background: string;
  lighting: string;
  extra: string;
}) {
  const parts = [
    "Full-body fashion model",
    opts.age,
    opts.expression,
    opts.height,
    opts.build,
    opts.background,
    opts.lighting,
  ].filter(Boolean);
  const base = parts.join(", ") + ".";
  return opts.extra.trim() ? `${base} ${opts.extra.trim()}` : base;
}

export function NewJobForm({ initialFolders, lockedFolderId, lockedFolderName }: NewJobFormProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderOption[]>(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState(lockedFolderId ?? "");
  const [newFolderName, setNewFolderName] = useState("");
  const [garmentFile, setGarmentFile] = useState<File | null>(null);

  // Model builder state
  const [height, setHeight] = useState(HEIGHT_OPTIONS[2].value);
  const [build, setBuild] = useState(BUILD_OPTIONS[1].value);
  const [age, setAge] = useState(AGE_OPTIONS[6].value); // mid 20s default
  const [expression, setExpression] = useState(EXPRESSION_OPTIONS[0].value);
  const [background, setBackground] = useState(BACKGROUND_OPTIONS[0].value);
  const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0].value);
  const [extra, setExtra] = useState("");

  const modelPrompt = useMemo(
    () => buildModelPrompt({ height, build, age, expression, background, lighting, extra }),
    [height, build, age, expression, background, lighting, extra],
  );

  const [loading, setLoading] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !!garmentFile && !!modelPrompt.trim() && !loading,
    [garmentFile, modelPrompt, loading],
  );

  useEffect(() => {
    if (lockedFolderId) setSelectedFolderId(lockedFolderId);
  }, [lockedFolderId]);

  async function submit() {
    if (!garmentFile || !modelPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const garmentImageDataUrl = await fileToDataUrl(garmentFile);

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          garmentImageDataUrl,
          modelPrompt,
          folderId: selectedFolderId || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (res.status === 401) {
        router.push("/login?next=/app");
        return;
      }
      if (res.status === 402) {
        router.push("/app/credits");
        return;
      }
      if (!res.ok) throw new Error(data?.error || MESSAGES.jobs.couldNotCreateGenerationJob);
      if (!data?.id) throw new Error(MESSAGES.jobs.generationJobMissingId);
      router.push(`/app/jobs/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name) {
      setError(MESSAGES.folders.folderNameRequired);
      return;
    }
    setFolderLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => null)) as
        | { folder?: FolderOption; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error || MESSAGES.folders.couldNotCreateFolder);
      if (!data?.folder) throw new Error(MESSAGES.folders.couldNotCreateFolder);
      const createdFolder = data.folder;
      setFolders((prev) => [createdFolder, ...prev]);
      setSelectedFolderId(createdFolder.id);
      setNewFolderName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setFolderLoading(false);
    }
  }

  return (
    <div className="surface-card reveal-up p-4 min-[390px]:p-5 sm:p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">New Photoshoot</h2>
          <p className="text-sm text-zinc-600">
            Upload a garment, configure the model, and we&apos;ll generate 6 editorial images — a hero shot plus five pose
            variations, all with a consistent model and identical garment.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {lockedFolderId ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800">
            Project: <span className="font-semibold">{lockedFolderName ?? "Current project"}</span>
          </div>
        ) : (
          <label className="block">
            <div className="text-sm font-medium text-zinc-700">Project</div>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="focus-ring mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400 sm:h-10"
              disabled={loading || folderLoading}
            >
              <option value="">No project</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                maxLength={60}
                className="focus-ring h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400 sm:h-10"
                placeholder="Create project name"
                disabled={loading || folderLoading}
              />
              <button
                type="button"
                onClick={createFolder}
                disabled={loading || folderLoading}
                className="focus-ring h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 sm:h-10 sm:w-auto"
              >
                {folderLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </label>
        )}

        <label className="block">
          <div className="text-sm font-medium text-zinc-700">Garment image</div>
          <input
            type="file"
            accept="image/*"
            className="focus-ring mt-2 block w-full rounded-xl border border-zinc-200 bg-white p-2 text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
            onChange={(e) => setGarmentFile(e.target.files?.[0] ?? null)}
            disabled={loading}
          />
          <div className="mt-2 text-xs text-zinc-500">Use a clean, flat-lay or product photo — plain background works best.</div>
          {garmentFile && <div className="mt-1 truncate text-xs text-zinc-700">Selected: {garmentFile.name}</div>}
        </label>

        {/* Model builder */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-700">Model &amp; shoot</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Height</label>
              <select
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                disabled={loading}
                title="Height"
                className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:h-10"
              >
                {HEIGHT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Build</label>
              <select
                value={build}
                onChange={(e) => setBuild(e.target.value)}
                disabled={loading}
                title="Build"
                className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:h-10"
              >
                {BUILD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Age range</label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={loading}
                title="Age range"
                className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:h-10"
              >
                {AGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Expression</label>
              <select
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                disabled={loading}
                title="Expression"
                className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:h-10"
              >
                {EXPRESSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Background</label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                disabled={loading}
                title="Background"
                className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:h-10"
              >
                {BACKGROUND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Lighting</label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                disabled={loading}
                title="Lighting"
                className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:h-10"
              >
                {LIGHTING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Extra details <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              disabled={loading}
              placeholder="e.g. long auburn hair, warm brown skin, freckles"
              className="focus-ring h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 sm:h-10"
            />
          </div>

          {/* Live prompt preview */}
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            <span className="mr-1 font-semibold text-zinc-400">AI prompt preview:</span>
            {modelPrompt}
          </div>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-6">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="focus-ring attention-glow touch-min-h inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating…
            </>
          ) : (
            "Generate photoshoot"
          )}
        </button>
        {loading && <GeneratingIndicator />}
      </div>
    </div>
  );
}

