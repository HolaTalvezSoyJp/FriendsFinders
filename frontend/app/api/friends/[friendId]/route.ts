import { NextRequest, NextResponse } from "next/server";
import { removeFriendship } from "@/lib/mocks/state";

export function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  return params.then(({ friendId }) => {
    const userId = req.headers.get("x-user-id") ?? "alice";
    removeFriendship(userId, friendId);
    return new NextResponse(null, { status: 204 });
  });
}
