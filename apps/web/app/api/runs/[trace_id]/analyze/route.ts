import { NextResponse } from "next/server";
import { enqueueForensicsJob } from "@/app/lib/queue";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ trace_id: string }> },
) {
  const { trace_id } = await params;
  const jobId = await enqueueForensicsJob(trace_id);
  return NextResponse.json({
    job_id: jobId ?? `job_${trace_id}_${Date.now()}`,
    state: "queued",
  });
}
