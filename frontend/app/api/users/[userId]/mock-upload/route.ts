import { NextResponse } from "next/server";

// Accepts the file upload from the avatar uploader in mock mode — no-op.
export function PUT() {
  return new NextResponse(null, { status: 200 });
}
