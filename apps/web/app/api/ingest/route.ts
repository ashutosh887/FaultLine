import { NextRequest, NextResponse } from "next/server";
import {
  ingestBodySchema,
  INGEST_MAX_BODY_BYTES,
  logWithTrace,
} from "@faultline/shared";
import { randomBytes } from "crypto";
import { enqueueForensicsJob } from "@/app/lib/queue";
import { checkRateLimit, getRateLimitKey } from "@/app/lib/rate-limit";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const key = getRateLimitKey(request);
  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > INGEST_MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }
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

  const jobId = await enqueueForensicsJob(trace_id, session_id);
  logWithTrace(trace_id, "ingest_accepted", {
    events_received: parsed.data.events.length,
    job_id: jobId,
  });

  return NextResponse.json({
    ok: true,
    trace_id,
    session_id: session_id ?? null,
    events_received: parsed.data.events.length,
  });
}
