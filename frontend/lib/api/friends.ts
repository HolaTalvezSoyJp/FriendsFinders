import { apiRequest } from "./client";

export function removeFriend(friendId: string): Promise<void> {
  return apiRequest<void>(`/friends/${friendId}`, { method: "DELETE" });
}
