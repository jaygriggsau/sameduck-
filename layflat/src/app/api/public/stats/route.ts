import { NextResponse } from "next/server";

import { getPublicStats } from "@/lib/publicStats";

export async function GET() {
  const stats = await getPublicStats();
  return NextResponse.json(stats, {
    headers: {
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

