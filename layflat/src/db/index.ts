import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { getDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

declare global {
  var __dbPool: Pool | undefined;
  var __drizzleDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getPool() {
  if (!globalThis.__dbPool) {
    globalThis.__dbPool = new Pool({ connectionString: getDatabaseUrl() });
  }
  return globalThis.__dbPool;
}

export function getDb() {
  if (!globalThis.__drizzleDb) {
    globalThis.__drizzleDb = drizzle(getPool(), { schema });
  }
  return globalThis.__drizzleDb;
}

