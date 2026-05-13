"use client";

import { useState } from "react";
import { Map, List } from "lucide-react";
import { useFriendsStore } from "@/lib/store/friends";
import { FriendListItem } from "@/components/friends/FriendListItem";
import { LiveMap } from "@/components/friends/LiveMap";

export default function FriendsPage() {
  const friends = useFriendsStore((s) => s.friends);
  const [view, setView] = useState<"list" | "map">("list");

  const entries = Array.from(friends.values()).sort(
    (a, b) => a.distanceMiles - b.distanceMiles
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <h1 className="text-2xl font-bold">Friends</h1>
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              view === "list"
                ? "bg-white/10 text-white"
                : "text-muted hover:text-white"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              view === "map"
                ? "bg-white/10 text-white"
                : "text-muted hover:text-white"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="text-5xl">👥</div>
            <p className="font-semibold text-white">No friends online nearby</p>
            <p className="text-sm text-muted">
              Open Discover to find people and send friend requests.
            </p>
          </div>
        ) : view === "list" ? (
          <div className="space-y-1">
            {entries.map((entry) => (
              <FriendListItem key={entry.friendId} entry={entry} />
            ))}
          </div>
        ) : (
          <LiveMap friends={entries} />
        )}
      </div>
    </div>
  );
}
