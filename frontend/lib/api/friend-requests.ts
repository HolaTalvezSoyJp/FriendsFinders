import { apiRequest } from "./client";
import type { FriendRequest } from "@/lib/types";

export function fetchFriendRequests(): Promise<FriendRequest[]> {
  return apiRequest<FriendRequest[]>("/friend-requests");
}

export function sendFriendRequest(toUserId: string): Promise<FriendRequest> {
  return apiRequest<FriendRequest>(`/friend-requests/${toUserId}`, {
    method: "POST",
  });
}

export function acceptFriendRequest(requestId: string): Promise<void> {
  return apiRequest<void>(`/friend-requests/${requestId}/accept`, {
    method: "PUT",
  });
}

export function declineFriendRequest(requestId: string): Promise<void> {
  return apiRequest<void>(`/friend-requests/${requestId}/decline`, {
    method: "PUT",
  });
}
