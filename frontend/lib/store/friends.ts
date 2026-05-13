import { create } from "zustand";
import type { NearbyFriendEntry } from "@/lib/types";

interface FriendsState {
  friends: Map<string, NearbyFriendEntry>;
  setFriends: (map: Map<string, NearbyFriendEntry>) => void;
  upsertFriend: (friendId: string, entry: NearbyFriendEntry) => void;
  removeFriend: (friendId: string) => void;
}

export const useFriendsStore = create<FriendsState>()((set) => ({
  friends: new Map(),
  setFriends: (friends) => set({ friends: new Map(friends) }),
  upsertFriend: (friendId, entry) =>
    set((state) => {
      const next = new Map(state.friends);
      next.set(friendId, entry);
      return { friends: next };
    }),
  removeFriend: (friendId) =>
    set((state) => {
      const next = new Map(state.friends);
      next.delete(friendId);
      return { friends: next };
    }),
}));
