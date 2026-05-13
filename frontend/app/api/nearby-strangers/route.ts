import { NextRequest, NextResponse } from "next/server";
import { getNearbyStrangers } from "@/lib/mocks/seed";
import { getFriends } from "@/lib/mocks/state";

export function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? "alice";
  const friendIds = new Set(getFriends(userId));
  const strangers = getNearbyStrangers(userId).filter(
    (s) => !friendIds.has(s.userId)
  );
  return NextResponse.json(strangers);
}
