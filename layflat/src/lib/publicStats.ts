import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { jobOutputs, jobs, users } from "@/db/schema";

export type PublicStats = {
  totalUsers: number;
  activeCreators: number;
  totalJobs: number;
  completedJobs: number;
  totalGeneratedPhotos: number;
  completionRate: number;
};

const EMPTY_STATS: PublicStats = {
  totalUsers: 0,
  activeCreators: 0,
  totalJobs: 0,
  completedJobs: 0,
  totalGeneratedPhotos: 0,
  completionRate: 0,
};

function readCount(row: { value: number } | undefined) {
  return typeof row?.value === "number" ? row.value : 0;
}

export async function getPublicStats(): Promise<PublicStats> {
  try {
    const db = getDb();

    const [totalUsersRes, activeCreatorsRes, totalJobsRes, completedJobsRes, generatedPhotosRes] = await Promise.all([
      db
        .select({
          value: sql<number>`cast(count(*) as integer)`,
        })
        .from(users),
      db
        .select({
          value: sql<number>`cast(count(distinct ${jobs.userId}) as integer)`,
        })
        .from(jobs),
      db
        .select({
          value: sql<number>`cast(count(*) as integer)`,
        })
        .from(jobs),
      db
        .select({
          value: sql<number>`cast(count(*) as integer)`,
        })
        .from(jobs)
        .where(eq(jobs.status, "done")),
      db
        .select({
          value: sql<number>`cast(count(*) as integer)`,
        })
        .from(jobOutputs),
    ]);

    const totalUsers = readCount(totalUsersRes[0]);
    const activeCreators = readCount(activeCreatorsRes[0]);
    const totalJobs = readCount(totalJobsRes[0]);
    const completedJobs = readCount(completedJobsRes[0]);
    const totalGeneratedPhotos = readCount(generatedPhotosRes[0]);
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return {
      totalUsers,
      activeCreators,
      totalJobs,
      completedJobs,
      totalGeneratedPhotos,
      completionRate,
    };
  } catch {
    return EMPTY_STATS;
  }
}

