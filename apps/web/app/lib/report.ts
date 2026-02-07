import type { CausalGraph, VerdictPack } from "@faultline/shared";
import type { TraceEvent } from "@faultline/shared";
import {
  getEvents,
  getReport as getStoredReport,
  getRunStatus,
} from "./redis-store";

export type FailureAnchor = {
  failure_event_id?: string;
  failure_reason?: string;
};

export type ReportData = {
  trace_id: string;
  timeline: TraceEvent[];
  verdict: VerdictPack | null;
  causal_graph: CausalGraph;
  failure_anchor: FailureAnchor | null;
};

export async function getReport(trace_id: string): Promise<ReportData> {
  const events = await getEvents(trace_id);
  const { verdict, causal_graph } = await getStoredReport(trace_id);
  const run = await getRunStatus(trace_id);
  const failure_anchor: FailureAnchor | null =
    run?.status === "failed" && (run.failure_reason ?? run.failure_event_id)
      ? {
          failure_event_id: run.failure_event_id,
          failure_reason: run.failure_reason,
        }
      : null;
  return {
    trace_id,
    timeline: events,
    verdict,
    causal_graph,
    failure_anchor,
  };
}
