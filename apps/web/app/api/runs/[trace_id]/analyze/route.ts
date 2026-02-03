import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trace_id: string }> }
) {
  const { trace_id } = await params;

  return NextResponse.json({
    job_id: `job_${Date.now()}`,
    state: "queued",
  });
}
