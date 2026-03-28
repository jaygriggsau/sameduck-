import { put } from "@vercel/blob";

import { MESSAGES } from "@/lib/messages";

const PREFIX = "sameduck/jobs";

function extensionForContentType(contentType: string): string {
  const t = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (t.includes("png")) return "png";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  if (t.includes("gif")) return "gif";
  return "webp";
}

/**
 * Fetches each Replicate output and uploads to Vercel Blob. Returns permanent public URLs.
 * Without BLOB_READ_WRITE_TOKEN: on Vercel production, throws; locally, returns original URLs (ephemeral).
 */
export async function persistReplicateOutputsToBlob(jobId: string, replicateUrls: string[]): Promise<string[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    if (process.env.VERCEL_ENV === "production") {
      throw new Error(MESSAGES.jobs.blobStorageNotConfigured);
    }
    console.warn(
      "[Same Duck] BLOB_READ_WRITE_TOKEN is not set; using temporary image URLs. Add a Blob store in Vercel and set the token for production.",
    );
    return replicateUrls;
  }

  const stored: string[] = [];
  for (let i = 0; i < replicateUrls.length; i++) {
    const sourceUrl = replicateUrls[i];
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(MESSAGES.jobs.couldNotFetchOutputForStorage);
    }
    const buf = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "image/webp";
    const ext = extensionForContentType(contentType);
    const pathname = `${PREFIX}/${jobId}/${i}.${ext}`;
    const uploaded = await put(pathname, buf, {
      access: "public",
      contentType,
      token,
      addRandomSuffix: false,
    });
    stored.push(uploaded.url);
  }
  return stored;
}
