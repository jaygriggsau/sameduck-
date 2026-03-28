import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { folders, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ProjectsDashboard } from "@/app/app/ProjectsDashboard";

export default async function AppHome() {
  const user = await requireUser();
  const db = getDb();

  const [userFolders, projectStats] = await Promise.all([
    db
      .select({ id: folders.id, name: folders.name, createdAt: folders.createdAt })
      .from(folders)
      .where(eq(folders.userId, user.id))
      .orderBy(desc(folders.createdAt)),
    db
      .select({
        folderId: jobs.folderId,
        jobCount: sql<number>`cast(count(*) as integer)`,
        lastJobAt: sql<Date | null>`max(${jobs.createdAt})`,
      })
      .from(jobs)
      .where(and(eq(jobs.userId, user.id), isNotNull(jobs.folderId)))
      .groupBy(jobs.folderId),
  ]);

  const statsByFolderId = new Map(
    projectStats
      .filter((s): s is { folderId: string; jobCount: number; lastJobAt: Date | null } => !!s.folderId)
      .map((s) => [s.folderId, { jobCount: s.jobCount, lastJobAt: s.lastJobAt }]),
  );

  const projects = userFolders.map((f) => ({
    id: f.id,
    name: f.name,
    createdAt: f.createdAt.toISOString(),
    jobCount: statsByFolderId.get(f.id)?.jobCount ?? 0,
    lastJobAt: statsByFolderId.get(f.id)?.lastJobAt
      ? new Date(statsByFolderId.get(f.id)!.lastJobAt as unknown as string | Date).toISOString()
      : null,
  }));

  return <ProjectsDashboard initialProjects={projects} />;
}
