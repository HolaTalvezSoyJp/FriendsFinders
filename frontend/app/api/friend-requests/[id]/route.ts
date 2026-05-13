import { NextRequest, NextResponse } from "next/server";
import { createFriendRequest } from "@/lib/mocks/state";

// POST /api/friend-requests/{toUserId}
export function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return params.then(({ id: toUserId }) => {
    const fromUserId = req.headers.get("x-user-id") ?? "alice";
    try {
      const request = createFriendRequest(fromUserId, toUserId);
      return NextResponse.json(request, { status: 201 });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : "Error";
      return NextResponse.json({ error: message }, { status });
    }
  });
}
