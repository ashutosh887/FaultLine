import { NextResponse } from "next/server";
import { getAllTraceIds, getEvents, getReport } from "@/app/lib/redis-store";

export async function GET() {
  const traceIds = await getAllTraceIds();
  const runs = await Promise.all(
    traceIds.map(async (id) => {
      const events = await getEvents(id);
      const { verdict } = await getReport(id);
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

      return {
        id,
        status: verdict ? "analyzed" : "running",
        duration_ms,
        failure_reason: verdict?.root_cause ?? undefined,
      };
    }),
  );

  return NextResponse.json({ runs });
}
