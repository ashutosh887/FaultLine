import type { CausalGraph, VerdictPack } from "@faultline/shared";
import type { TraceEvent } from "@faultline/shared";
import { getEvents, getReport as getStoredReport } from "./redis-store";

export type ReportData = {
  trace_id: string;
  timeline: TraceEvent[];
  verdict: VerdictPack | null;
  causal_graph: CausalGraph;
};

export async function getReport(trace_id: string): Promise<ReportData> {
  const events = await getEvents(trace_id);
  const { verdict, causal_graph } = await getStoredReport(trace_id);
  return {
    trace_id,
    timeline: events,
    verdict,
    causal_graph,
  };
}
