import { NextResponse } from "next/server";
import { deleteTrace } from "@/app/lib/redis-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ trace_id: string }> },
) {
  const { trace_id } = await params;
  await deleteTrace(trace_id);
  return NextResponse.json({ ok: true, trace_id });
}
