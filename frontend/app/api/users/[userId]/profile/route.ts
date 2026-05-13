import { NextRequest, NextResponse } from "next/server";
import { getProfile, upsertProfile } from "@/lib/mocks/state";
import { SEED_PROFILES } from "@/lib/mocks/seed";

export function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return params.then(({ userId }) => {
    const profile = getProfile(userId) ?? SEED_PROFILES[userId as keyof typeof SEED_PROFILES];
    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = upsertProfile(userId, body);
  return NextResponse.json(updated);
}
