import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  searchParams.get("status");
  searchParams.get("limit");

  return NextResponse.json({
    runs: [],
  });
}
