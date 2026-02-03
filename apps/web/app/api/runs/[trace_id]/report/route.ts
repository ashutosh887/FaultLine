import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trace_id: string }> }
) {
  const { trace_id } = await params;

  return NextResponse.json({
    trace_id,
    timeline: [],
    verdict: {
      root_cause: "",
      evidence: [] as string[],
      contributing_factors: [] as { factor: string; evidence: string[] }[],
      counterfactual: "",
      fixes: [] as { fix: string; evidence: string[] }[],
    },
    causal_graph: { nodes: [], edges: [] },
  });
}
