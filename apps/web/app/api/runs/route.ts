import { NextRequest, NextResponse } from "next/server";
import {
  getAllTraceIds,
  getEvents,
  getReport,
  getRunStatus,
} from "@/app/lib/redis-store";

export async function GET(request: NextRequest) {
  const project_id =
    request.nextUrl.searchParams.get("project_id") ?? undefined;
  const traceIds = await getAllTraceIds(project_id);
  const runs = await Promise.all(
    traceIds.map(async (id) => {
      const events = await getEvents(id);
      const { verdict } = await getReport(id);
      const runStatus = await getRunStatus(id);
      const lastEvent = events[events.length - 1];
      const firstEvent = events[0];
      const duration_ms =
        lastEvent && firstEvent
          ? (typeof lastEvent.timestamp === "number"
              ? lastEvent.timestamp
              : new Date(lastEvent.timestamp).getTime()) -
            (typeof firstEvent.timestamp === "number"
              ? firstEvent.timestamp
              : new Date(firstEvent.timestamp).getTime())
          : undefined;

      const status = runStatus
        ? ["failed", "completed", "succeeded"].includes(runStatus.status)
          ? runStatus.status
          : verdict
            ? "analyzed"
            : "running"
        : verdict
          ? "analyzed"
          : "running";
      const failure_reason =
        runStatus?.status === "failed" && runStatus.failure_reason
          ? runStatus.failure_reason
          : (verdict?.root_cause ?? undefined);

      return {
        id,
        status,
        duration_ms,
        failure_reason,
        failure_event_id: runStatus?.failure_event_id,
      };
    }),
  );

  return NextResponse.json({ runs });
}
