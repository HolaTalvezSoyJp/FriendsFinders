import { NextRequest, NextResponse } from "next/server";
import { getPendingRequests } from "@/lib/mocks/state";

export function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? "alice";
  return NextResponse.json(getPendingRequests(userId));
}
