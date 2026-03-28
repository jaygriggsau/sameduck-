import Replicate from "replicate";
import { getReplicateToken } from "@/lib/env";

export function getReplicateClient() {
  const REPLICATE_API_TOKEN = getReplicateToken();
  return new Replicate({ auth: REPLICATE_API_TOKEN });
}

