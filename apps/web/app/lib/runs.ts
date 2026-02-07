import {
  getAllTraceIds,
  getEvents,
  getReport,
  getRunStatus,
} from "./redis-store";

export type RunSummary = {
  id: string;
  status: string;
  duration_ms?: number;
  failure_reason?: string;
  failure_event_id?: string;
};

export async function getRuns(project_id?: string): Promise<RunSummary[]> {
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
  return runs;
}
