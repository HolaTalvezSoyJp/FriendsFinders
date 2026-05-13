"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFriendRequests } from "@/lib/api/friend-requests";
import { RequestCard } from "@/components/requests/RequestCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestsPage() {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: fetchFriendRequests,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <h1 className="px-2 text-2xl font-bold">Requests</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="text-5xl">🔔</div>
          <p className="font-semibold text-white">No pending requests</p>
          <p className="text-sm text-muted">
            Friend requests from nearby people will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard key={req.requestId} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
