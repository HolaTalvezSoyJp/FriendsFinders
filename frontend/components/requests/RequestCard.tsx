"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/api/profile";
import { acceptFriendRequest, declineFriendRequest } from "@/lib/api/friend-requests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { FriendRequest } from "@/lib/types";

interface Props {
  request: FriendRequest;
}

export function RequestCard({ request }: Props) {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", request.fromUserId],
    queryFn: () => fetchProfile(request.fromUserId),
    staleTime: 5 * 60_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["friend-requests"] });

  const acceptMutation = useMutation({
    mutationFn: () => acceptFriendRequest(request.requestId),
    onSuccess: () => {
      toast.success(`You and ${profile?.displayName ?? request.fromUserId} are now friends!`);
      invalidate();
    },
    onError: () => toast.error("Failed to accept request"),
  });

  const declineMutation = useMutation({
    mutationFn: () => declineFriendRequest(request.requestId),
    onSuccess: () => {
      toast.info("Request declined");
      invalidate();
    },
    onError: () => toast.error("Failed to decline request"),
  });

  const name = profile?.displayName ?? request.fromUserId;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const busy = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
      <Avatar className="h-14 w-14 shrink-0">
        <AvatarImage src={profile?.profilePictureUrl} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{name}</p>
        <p className="text-xs text-muted">wants to be your friend</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => declineMutation.mutate()}
          disabled={busy}
        >
          Decline
        </Button>
        <Button
          size="sm"
          onClick={() => acceptMutation.mutate()}
          disabled={busy}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
