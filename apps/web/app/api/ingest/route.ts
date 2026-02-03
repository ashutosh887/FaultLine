import { NextRequest, NextResponse } from "next/server";
import { ingestBodySchema } from "@faultline/shared";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = ingestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const trace_id = parsed.data.trace_id ?? randomBytes(16).toString("hex");
  const session_id = parsed.data.session_id;

  return NextResponse.json({
    ok: true,
    trace_id,
    session_id: session_id ?? null,
    events_received: parsed.data.events.length,
  });
}
