import { NextRequest, NextResponse } from "next/server";

// In mock mode, return a no-op upload URL (the PUT will succeed but go nowhere).
export function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return params.then(({ userId }) => {
    const key = `profile-pictures/${userId}/${Date.now()}.jpg`;
    // Point to a local no-op endpoint so the PUT doesn't 404
    const uploadUrl = `/api/users/${userId}/mock-upload`;
    return NextResponse.json({ uploadUrl, key });
  });
}
