import { NextRequest, NextResponse } from "next/server";
import { acceptRequest } from "@/lib/mocks/state";

// PUT /api/friend-requests/{requestId}/accept
export function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return params.then(({ id: requestId }) => {
    const userId = req.headers.get("x-user-id") ?? "alice";
    try {
      acceptRequest(requestId, userId);
      return new NextResponse(null, { status: 204 });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : "Error";
      return NextResponse.json({ error: message }, { status });
    }
  });
}
