import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trace_id: string }> }
) {
  const { trace_id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = (body as { status?: string }).status;
  const failure_anchor = (body as { failure_anchor?: { event_id: string; reason: string } }).failure_anchor;

  if (!status || !["failed", "completed"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'failed' or 'completed'" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
