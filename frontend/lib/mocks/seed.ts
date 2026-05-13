import type { UserProfile, NearbyFriendEntry, NearbyStrangerEntry } from "@/lib/types";

export const SEED_USER_IDS = ["alice", "bob", "carol"] as const;
export type SeedUserId = (typeof SEED_USER_IDS)[number];

export const SEED_PROFILES: Record<SeedUserId, UserProfile> = {
  alice: {
    userId: "alice",
    displayName: "Alice Chen",
    profilePictureUrl: "https://picsum.photos/seed/alice-ff/400/600",
    discoverable: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  bob: {
    userId: "bob",
    displayName: "Bob Martinez",
    profilePictureUrl: "https://picsum.photos/seed/bob-ff/400/600",
    discoverable: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  carol: {
    userId: "carol",
    displayName: "Carol Kim",
    profilePictureUrl: "https://picsum.photos/seed/carol-ff/400/600",
    discoverable: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
};

// San Francisco base coordinates
export const BASE_LOCATIONS: Record<SeedUserId, { lat: number; lng: number }> =
  {
    alice: { lat: 37.7749, lng: -122.4194 },
    bob: { lat: 37.7825, lng: -122.4155 },
    carol: { lat: 37.769, lng: -122.4255 },
  };

export function getNearbyStrangers(requestingUserId: string): NearbyStrangerEntry[] {
  return SEED_USER_IDS.filter((id) => id !== requestingUserId).map((id) => {
    const profile = SEED_PROFILES[id];
    const base = BASE_LOCATIONS[id];
    const reqBase = BASE_LOCATIONS[requestingUserId as SeedUserId] ?? BASE_LOCATIONS.alice;
    const dist = haversine(reqBase.lat, reqBase.lng, base.lat, base.lng);
    return {
      userId: id,
      displayName: profile.displayName,
      profilePictureUrl: profile.profilePictureUrl ?? "",
      distanceMiles: dist,
    };
  });
}

export function getNearbyFriends(
  friendIds: string[]
): NearbyFriendEntry[] {
  return friendIds
    .filter((id): id is SeedUserId =>
      SEED_USER_IDS.includes(id as SeedUserId)
    )
    .map((id) => {
      const base = BASE_LOCATIONS[id];
      return {
        friendId: id,
        latitude: base.lat,
        longitude: base.lng,
        lastUpdated: new Date().toISOString(),
        distanceMiles: parseFloat((0.5 + Math.random() * 1.5).toFixed(1)),
      };
    });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
