import { NextRequest, NextResponse } from "next/server";
import { setRunStatus } from "@/app/lib/redis-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trace_id: string }> },
) {
  const { trace_id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, failure_reason, failure_event_id } = body as {
    status?: string;
    failure_reason?: string;
    failure_event_id?: string;
  };

  if (!status || !["failed", "completed"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'failed' or 'completed'" },
      { status: 400 },
    );
  }

  await setRunStatus(trace_id, {
    status: status as "failed" | "completed",
    failure_reason:
      typeof failure_reason === "string" ? failure_reason : undefined,
    failure_event_id:
      typeof failure_event_id === "string" ? failure_event_id : undefined,
  });

  return NextResponse.json({ ok: true, trace_id });
}
