import { Redis } from "ioredis";
import type { CausalGraph, TraceEvent, VerdictPack } from "@faultline/shared";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  lazyConnect: true,
});

const EVENTS_KEY = (trace_id: string) => `faultline:events:${trace_id}`;
const REPORT_KEY = (trace_id: string) => `faultline:report:${trace_id}`;
const RUN_KEY = (trace_id: string) => `faultline:run:${trace_id}`;
const TRACES_KEY = "faultline:traces";

async function storeEvents(
  trace_id: string,
  events: TraceEvent[],
): Promise<void> {
  await redis.connect();
  await redis.set(EVENTS_KEY(trace_id), JSON.stringify(events));
  await redis.sadd(TRACES_KEY, trace_id);
}

async function storeReport(
  trace_id: string,
  verdict: VerdictPack | null,
  causal_graph: CausalGraph,
): Promise<void> {
  await redis.set(
    REPORT_KEY(trace_id),
    JSON.stringify({ verdict, causal_graph }),
  );
}

async function setRunStatus(
  trace_id: string,
  run: {
    status: "running" | "failed" | "completed" | "succeeded";
    failure_reason?: string;
    failure_event_id?: string;
  },
): Promise<void> {
  await redis.set(RUN_KEY(trace_id), JSON.stringify(run));
}

const trace1 = "demo-bad-run";
const trace2 = "demo-fixed-run";

const badVerdict: VerdictPack = {
  root_cause:
    "The flight_search tool rejected the date format (2026-02-04) with error 'Invalid date format: expected YYYY-MM-DD but got 2026-02-04'. The tool expects YYYY-MM-DD but received a value that triggered validation failure.",
  evidence_links: [
    {
      step_id: "Step 2",
      snippet: "Invalid date format: expected YYYY-MM-DD but got 2026-02-04",
    },
  ],
  confidence_root_cause: 0.92,
  confidence_factors: 0.88,
  contributing_factors: [
    {
      rank: 1,
      description:
        "Tool input validation mismatch — agent passed date in wrong format",
      evidence_links: [{ step_id: "Step 2" }],
    },
    {
      rank: 2,
      description: "No retry or format correction before tool call",
      evidence_links: [{ step_id: "Step 1" }],
    },
  ],
  counterfactual:
    "If the agent had formatted the date as YYYY-MM-DD (e.g., 2026-02-05) before calling flight_search, the tool would have succeeded.",
  fix_suggestions: [
    {
      category: "prompt",
      description:
        "Add instruction to always format dates as YYYY-MM-DD for flight_search",
      evidence_links: [{ step_id: "Step 2" }],
    },
    {
      category: "tooling",
      description:
        "Add input validation/transform layer before flight_search to normalize date format",
      evidence_links: [{ step_id: "Step 2" }],
    },
  ],
};

const fixedVerdict: VerdictPack = {
  root_cause:
    "No failure — the run completed successfully. The flight_search tool accepted the date format and returned flight options.",
  evidence_links: [
    {
      step_id: "Step 2",
      snippet:
        "input: { origin: 'NYC', destination: 'LAX', date: '2026-02-05' }",
    },
  ],
  confidence_root_cause: 0.95,
  confidence_factors: 0.9,
  contributing_factors: [
    {
      rank: 1,
      description: "Correct date format (YYYY-MM-DD) used in tool call",
      evidence_links: [{ step_id: "Step 2" }],
    },
  ],
  counterfactual: "N/A — successful run",
  fix_suggestions: [],
};

const badGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "Flight search error",
      type: "tool_output",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "Model reports failure",
      type: "step",
      step_id: "Step 3",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
  ],
  first_divergence_node_id: "n2",
};

const fixedGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "Flight search success",
      type: "tool_output",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "Model returns result",
      type: "step",
      step_id: "Step 3",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
  ],
  first_divergence_node_id: "n1",
};

async function seed() {
  const now = Date.now();

  console.log("Seeding demo traces...");

  await storeEvents(trace1, [
    {
      type: "user_input",
      trace_context: { trace_id: trace1 },
      timestamp: now - 10000,
      payload: {
        text: "Book a flight from NYC to LAX for tomorrow",
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace1 },
      timestamp: now - 9500,
      payload: {
        tool_name: "flight_search",
        input: { origin: "NYC", destination: "LAX", date: "2026-02-04" },
        error: "Invalid date format: expected YYYY-MM-DD but got 2026-02-04",
        latency_ms: 1200,
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace1 },
      timestamp: now - 8000,
      payload: {
        text: "I encountered an error searching for flights. The date format seems incorrect.",
        token_count: 45,
      },
    },
  ]);

  await storeEvents(trace2, [
    {
      type: "user_input",
      trace_context: { trace_id: trace2 },
      timestamp: now - 5000,
      payload: {
        text: "Book a flight from NYC to LAX for tomorrow",
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace2 },
      timestamp: now - 4500,
      payload: {
        tool_name: "flight_search",
        input: { origin: "NYC", destination: "LAX", date: "2026-02-05" },
        latency_ms: 800,
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace2 },
      timestamp: now - 3000,
      payload: {
        text: "Found 3 flights. The best option is Flight AA123 departing at 8:00 AM.",
        token_count: 52,
      },
    },
  ]);

  await setRunStatus(trace1, {
    status: "failed",
    failure_reason: "Invalid date format in flight_search tool call",
    failure_event_id: "Step 2",
  });
  await storeReport(trace1, badVerdict, badGraph);

  await setRunStatus(trace2, { status: "succeeded" });
  await storeReport(trace2, fixedVerdict, fixedGraph);

  console.log("✓ Seeded demo traces:", trace1, trace2);
  console.log("✓ Run status + verdict + causal graph for both");
  await redis.quit();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
