"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MESSAGES } from "@/lib/messages";

type ProjectRow = {
  id: string;
  name: string;
  createdAt: string;
  jobCount: number;
  lastJobAt: string | null;
};

export function ProjectsDashboard({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProject() {
    const name = newProjectName.trim();
    if (!name) {
      setError(MESSAGES.folders.folderNameRequired);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => null)) as
        | { folder?: { id: string; name: string; createdAt: string }; error?: string }
        | null;
      const folder = data?.folder;
      if (!res.ok || !folder) throw new Error(data?.error || MESSAGES.folders.couldNotCreateFolder);
      setNewProjectName("");
      setProjects((prev) => [
        { id: folder.id, name: folder.name, createdAt: folder.createdAt, jobCount: 0, lastJobAt: null },
        ...prev,
      ]);
      router.push(`/app/projects/${folder.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : MESSAGES.common.requestFailed);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="surface-card reveal-up p-4 min-[390px]:p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-tight text-zinc-900 min-[390px]:text-3xl">Projects</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Start by creating a project. Open any project to generate and manage its photoshoots.
            </p>
          </div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">Create project</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Summer Drop 2026"
              className="focus-ring h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 sm:h-10"
              disabled={creating}
            />
            <button
              type="button"
              onClick={createProject}
              disabled={creating}
              className="focus-ring touch-min-h h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:h-10 sm:w-auto"
            >
              {creating ? "Creating..." : "Create project"}
            </button>
          </div>
          {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div key={p.id} className="surface-card surface-card-hover p-5">
            <div className="truncate text-lg font-semibold tracking-tight text-zinc-900">{p.name}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
              Created {new Date(p.createdAt).toLocaleDateString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
              <span>{p.jobCount} jobs</span>
              {p.lastJobAt && (
                <>
                  <span>·</span>
                  <span>Last run {new Date(p.lastJobAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
            <Link
              href={`/app/projects/${p.id}`}
              className="focus-ring mt-5 inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Open project
              <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-12 text-center">
          <p className="text-base font-medium text-zinc-700">No projects yet</p>
          <p className="mt-1 text-sm text-zinc-500">Create your first project to start generating photoshoots.</p>
        </div>
      )}
    </div>
  );
}

