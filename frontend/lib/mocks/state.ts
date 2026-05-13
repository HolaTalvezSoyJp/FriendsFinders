// Server-side in-memory store for mock API routes.
// Resets on dev server restart — acceptable for dev/demo.

import type { FriendRequest, Friendship, UserProfile } from "@/lib/types";
import { SEED_PROFILES, type SeedUserId } from "./seed";

// Deep-clone seed profiles so mutations don't affect the seed
const profiles: Record<string, UserProfile> = Object.fromEntries(
  Object.entries(SEED_PROFILES).map(([k, v]) => [k, { ...v }])
);

let friendRequests: FriendRequest[] = [
  {
    requestId: "req-seed-1",
    fromUserId: "carol",
    toUserId: "alice",
    status: "pending",
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
];

let friendships: Friendship[] = [];

// ── Profiles ─────────────────────────────────────────────────────────────────

export function getProfile(userId: string): UserProfile | null {
  return profiles[userId] ?? null;
}

export function upsertProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
  const existing = profiles[userId] ?? {
    userId,
    displayName: userId,
    discoverable: true,
    createdAt: new Date().toISOString(),
  };
  profiles[userId] = { ...existing, ...updates, userId };
  return profiles[userId];
}

// ── Friendships ───────────────────────────────────────────────────────────────

export function getFriends(userId: string): string[] {
  return friendships.filter((f) => f.userId === userId).map((f) => f.friendId);
}

export function isFriend(userId: string, otherId: string): boolean {
  return friendships.some((f) => f.userId === userId && f.friendId === otherId);
}

export function addFriendship(a: string, b: string): void {
  if (!isFriend(a, b)) {
    const now = new Date().toISOString();
    friendships.push({ userId: a, friendId: b, createdAt: now });
    friendships.push({ userId: b, friendId: a, createdAt: now });
  }
}

export function removeFriendship(userId: string, friendId: string): void {
  friendships = friendships.filter(
    (f) =>
      !(f.userId === userId && f.friendId === friendId) &&
      !(f.userId === friendId && f.friendId === userId)
  );
}

// ── Friend Requests ───────────────────────────────────────────────────────────

export function getPendingRequests(toUserId: string): FriendRequest[] {
  return friendRequests.filter(
    (r) => r.toUserId === toUserId && r.status === "pending"
  );
}

export function createFriendRequest(
  fromUserId: string,
  toUserId: string
): FriendRequest {
  const duplicate = friendRequests.find(
    (r) =>
      r.fromUserId === fromUserId &&
      r.toUserId === toUserId &&
      r.status === "pending"
  );
  if (duplicate) throw Object.assign(new Error("Already requested"), { status: 409 });

  const request: FriendRequest = {
    requestId: `req-${Date.now()}`,
    fromUserId,
    toUserId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  friendRequests.push(request);
  return request;
}

export function acceptRequest(requestId: string, toUserId: string): void {
  const req = friendRequests.find(
    (r) => r.requestId === requestId && r.toUserId === toUserId
  );
  if (!req) throw Object.assign(new Error("Not found"), { status: 404 });
  req.status = "accepted";
  addFriendship(req.fromUserId, req.toUserId);
}

export function declineRequest(requestId: string, toUserId: string): void {
  const req = friendRequests.find(
    (r) => r.requestId === requestId && r.toUserId === toUserId
  );
  if (!req) throw Object.assign(new Error("Not found"), { status: 404 });
  req.status = "declined";
}

export function isSeedUser(id: string): id is SeedUserId {
  return ["alice", "bob", "carol"].includes(id);
}
