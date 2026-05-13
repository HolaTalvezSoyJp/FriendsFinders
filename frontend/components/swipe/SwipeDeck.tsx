"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import type { NearbyStrangerEntry } from "@/lib/types";

interface Props {
  strangers: NearbyStrangerEntry[];
  onSwipeRight: (s: NearbyStrangerEntry) => void;
  onSwipeLeft: (s: NearbyStrangerEntry) => void;
  onRefresh?: () => void;
}

export function SwipeDeck({ strangers, onSwipeRight, onSwipeLeft, onRefresh }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = strangers
    .filter((s) => !dismissed.has(s.userId))
    .slice(0, 3);

  const handleRight = (s: NearbyStrangerEntry) => {
    setDismissed((prev) => new Set([...prev, s.userId]));
    onSwipeRight(s);
  };

  const handleLeft = (s: NearbyStrangerEntry) => {
    setDismissed((prev) => new Set([...prev, s.userId]));
    onSwipeLeft(s);
  };

  if (visible.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
        <div className="text-6xl">🌎</div>
        <p className="text-xl font-semibold text-white">No one nearby right now</p>
        <p className="text-sm text-muted">
          Move around or check back later to find people nearby.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-2 rounded-full border border-white/10 px-6 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: "520px" }}>
      <AnimatePresence>
        {visible.map((stranger, index) => (
          <SwipeCard
            key={stranger.userId}
            stranger={stranger}
            isTop={index === 0}
            stackIndex={index}
            onSwipeRight={handleRight}
            onSwipeLeft={handleLeft}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
