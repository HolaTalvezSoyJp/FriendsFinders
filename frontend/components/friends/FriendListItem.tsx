"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/api/profile";
import { removeFriend } from "@/lib/api/friends";
import { useFriendsStore } from "@/lib/store/friends";
import { formatRelativeTime } from "@/lib/utils";
import { DistanceBadge } from "./DistanceBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { NearbyFriendEntry } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Props {
  entry: NearbyFriendEntry;
}

export function FriendListItem({ entry }: Props) {
  const removeFriendFromStore = useFriendsStore((s) => s.removeFriend);
  const queryClient = useQueryClient();
  const [, forceRender] = useState(0);

  // Re-render every 10s to refresh relative timestamps
  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", entry.friendId],
    queryFn: () => fetchProfile(entry.friendId),
    staleTime: 5 * 60_000,
  });

  const handleRemove = async () => {
    try {
      await removeFriend(entry.friendId);
      removeFriendFromStore(entry.friendId);
      queryClient.invalidateQueries({ queryKey: ["nearby-strangers"] });
      toast.success(`Removed ${profile?.displayName ?? entry.friendId}`);
    } catch {
      toast.error("Failed to remove friend");
    }
  };

  const initials = (profile?.displayName ?? entry.friendId)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10">
          <Avatar className="h-14 w-14">
            <AvatarImage
              src={profile?.profilePictureUrl}
              alt={profile?.displayName ?? entry.friendId}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">
              {profile?.displayName ?? entry.friendId}
            </p>
            <DistanceBadge miles={entry.distanceMiles} />
            <p className="mt-0.5 text-xs text-muted/60">
              {formatRelativeTime(entry.lastUpdated)}
            </p>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.profilePictureUrl} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{profile?.displayName ?? entry.friendId}</SheetTitle>
              <DistanceBadge miles={entry.distanceMiles} />
            </div>
          </div>
        </SheetHeader>
        <p className="text-xs text-muted mb-6">
          Last updated {formatRelativeTime(entry.lastUpdated)}
        </p>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleRemove}
        >
          Remove Friend
        </Button>
      </SheetContent>
    </Sheet>
  );
}
