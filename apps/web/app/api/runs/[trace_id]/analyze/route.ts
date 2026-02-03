import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ trace_id: string }> }
) {
  const { trace_id } = await params;

  return NextResponse.json({
    job_id: `job_${trace_id}_${Date.now()}`,
    state: "queued",
  });
}
