import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { folders, jobs, jobOutputs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { NewJobForm } from "@/app/app/NewJobForm";
import { JobList } from "@/app/app/JobList";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = getDb();

  const project = await db.query.folders.findFirst({
    where: (f, { and, eq }) => and(eq(f.id, id), eq(f.userId, user.id)),
  });
  if (!project) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-sm font-medium text-zinc-700">Project not found.</p>
        <Link href="/app" className="focus-ring mt-4 inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm text-zinc-700">
          Back to projects
        </Link>
      </div>
    );
  }

  const recent = await db
    .select({
      id: jobs.id,
      name: jobs.name,
      folderId: jobs.folderId,
      status: jobs.status,
      createdAt: jobs.createdAt,
      seedImageUrl: jobOutputs.imageUrl,
    })
    .from(jobs)
    .leftJoin(jobOutputs, and(eq(jobOutputs.jobId, jobs.id), eq(jobOutputs.variantIndex, 0)))
    .where(and(eq(jobs.userId, user.id), eq(jobs.folderId, id)))
    .orderBy(desc(jobs.createdAt))
    .limit(20);

  const serializedJobs = recent.map((j) => ({
    ...j,
    folderId: j.folderId ?? null,
    createdAt: j.createdAt.toISOString(),
  }));

  return (
      <div className="space-y-6">
      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/app" className="font-medium text-zinc-400 hover:text-zinc-700">Projects</Link>
          <span className="text-zinc-300">/</span>
          <span className="font-medium text-zinc-900">{project.name}</span>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-tight text-zinc-900 min-[390px]:text-3xl">{project.name}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Generate photoshoots in this project and keep all related jobs in one place.
            </p>
          </div>
          <Link
            href="/app"
            className="focus-ring inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ← All projects
          </Link>
        </div>
      </div>

      <NewJobForm
        initialFolders={[{ id: project.id, name: project.name }]}
        lockedFolderId={project.id}
        lockedFolderName={project.name}
      />

      <div className="surface-card">
        <div className="flex flex-col gap-2 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Project Jobs</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Open a job to review images, rename it, and download results.
            </p>
          </div>
          <Link
            href={`/app/projects/${project.id}`}
            className="focus-ring rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Refresh
          </Link>
        </div>

        <JobList initialJobs={serializedJobs} folderNameById={{ [project.id]: project.name }} />
      </div>
    </div>
  );
}

