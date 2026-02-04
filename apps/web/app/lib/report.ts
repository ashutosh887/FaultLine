import type { CausalGraph, VerdictPack } from "@faultline/shared";
import type { TraceEvent } from "@faultline/shared";

export type ReportData = {
  trace_id: string;
  timeline: TraceEvent[];
  verdict: VerdictPack | null;
  causal_graph: CausalGraph;
};

export async function getReport(trace_id: string): Promise<ReportData> {
  return {
    trace_id,
    timeline: [],
    verdict: null,
    causal_graph: { nodes: [], edges: [] },
  };
}
