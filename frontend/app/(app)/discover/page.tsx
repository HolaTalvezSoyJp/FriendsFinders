"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNearbyStrangers } from "@/lib/api/strangers";
import { sendFriendRequest } from "@/lib/api/friend-requests";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { ActionButtons } from "@/components/swipe/ActionButtons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { NearbyStrangerEntry } from "@/lib/types";
import { useRef } from "react";
import { ApiError } from "@/lib/api/client";

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const topRef = useRef<NearbyStrangerEntry | null>(null);

  const {
    data: strangers = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["nearby-strangers"],
    queryFn: fetchNearbyStrangers,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const likeMutation = useMutation({
    mutationFn: (userId: string) => sendFriendRequest(userId),
    onSuccess: (_, userId) => {
      const name =
        strangers.find((s) => s.userId === userId)?.displayName ?? userId;
      toast.success(`Request sent to ${name}`);
    },
    onError: (err, userId) => {
      const name =
        strangers.find((s) => s.userId === userId)?.displayName ?? userId;
      if (err instanceof ApiError && err.status === 409) {
        toast.info(`Already requested ${name}`);
      } else {
        toast.error("Failed to send request");
      }
    },
  });

  const handleSwipeRight = (s: NearbyStrangerEntry) => {
    likeMutation.mutate(s.userId);
  };

  const handleSwipeLeft = (_s: NearbyStrangerEntry) => {
    // local-only dismiss, no backend call
  };

  const handleLikeButton = () => {
    const top = strangers[0];
    if (top) handleSwipeRight(top);
  };

  const handlePassButton = () => {
    // Trigger the top card's swipe-left via refetch (deck will dismiss it)
    // We can't programmatically trigger framer drag, so we just skip with a no-op
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-8">
        <Skeleton className="h-[520px] w-full max-w-sm rounded-3xl" />
        <div className="flex gap-8">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-xl">Something went wrong</p>
        <button
          onClick={() => refetch()}
          className="rounded-full border border-white/10 px-6 py-2 text-sm text-muted hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl font-bold">Discover</h1>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["nearby-strangers"] })
          }
          className="text-xs text-muted hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Card deck */}
      <div className="flex-1">
        <SwipeDeck
          strangers={strangers}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onRefresh={() => refetch()}
        />
      </div>

      {/* Action buttons */}
      {strangers.length > 0 && (
        <ActionButtons
          onPass={handlePassButton}
          onLike={handleLikeButton}
          disabled={likeMutation.isPending}
        />
      )}
    </div>
  );
}
