import { apiRequest } from "./client";
import type { NearbyStrangerEntry } from "@/lib/types";

export function fetchNearbyStrangers(): Promise<NearbyStrangerEntry[]> {
  return apiRequest<NearbyStrangerEntry[]>("/nearby-strangers");
}
