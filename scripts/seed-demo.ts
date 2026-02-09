import { Redis } from "ioredis";
import type { CausalGraph, TraceEvent, VerdictPack } from "@faultline/shared";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_HOST?.includes("upstash.io")
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
  lazyConnect: true,
});

const EVENTS_KEY = (trace_id: string) => `faultline:events:${trace_id}`;
const REPORT_KEY = (trace_id: string) => `faultline:report:${trace_id}`;
const RUN_KEY = (trace_id: string) => `faultline:run:${trace_id}`;
const TRACES_KEY = "faultline:traces";
const PROJECT_TRACES_KEY = (p: string) => `faultline:project:${p}:traces`;
const TRACE_PROJECT_KEY = (t: string) => `faultline:trace_project:${t}`;

async function storeEvents(
  trace_id: string,
  events: TraceEvent[],
): Promise<void> {
  await redis.set(EVENTS_KEY(trace_id), JSON.stringify(events));
  await redis.sadd(TRACES_KEY, trace_id);
  await redis.sadd(PROJECT_TRACES_KEY("default"), trace_id);
  await redis.set(TRACE_PROJECT_KEY(trace_id), "default");
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

const now = Date.now();

// Case 1: Date format error (original)
const trace1 = "demo-bad-run";
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

// Case 2: Successful run (original)
const trace2 = "demo-fixed-run";
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

// Case 3: Memory retrieval failure
const trace3 = "demo-memory-failure";
const memoryVerdict: VerdictPack = {
  root_cause:
    "Memory retrieval failed — the agent attempted to access user preferences from memory but the key 'user_preferences' was not found. This caused the agent to use default values that conflicted with user's actual preferences.",
  evidence_links: [
    {
      step_id: "Step 3",
      snippet: "Memory key 'user_preferences' not found",
    },
  ],
  confidence_root_cause: 0.89,
  confidence_factors: 0.85,
  contributing_factors: [
    {
      rank: 1,
      description:
        "Memory key was never stored — agent assumed preferences existed",
      evidence_links: [{ step_id: "Step 1" }],
    },
    {
      rank: 2,
      description: "No fallback handling for missing memory keys",
      evidence_links: [{ step_id: "Step 3" }],
    },
  ],
  counterfactual:
    "If the agent had stored user preferences in Step 1 or handled missing keys gracefully, the run would have succeeded.",
  fix_suggestions: [
    {
      category: "memory",
      description:
        "Add memory existence check before retrieval, with fallback to defaults",
      evidence_links: [{ step_id: "Step 3" }],
    },
    {
      category: "orchestration",
      description:
        "Ensure memory operations complete before dependent tool calls",
      evidence_links: [{ step_id: "Step 1" }],
    },
  ],
};

// Case 4: API rate limit error
const trace4 = "demo-rate-limit";
const rateLimitVerdict: VerdictPack = {
  root_cause:
    "API rate limit exceeded — the weather_api tool returned HTTP 429 (Too Many Requests) after 5 consecutive calls within 1 second. The agent did not implement exponential backoff or rate limit handling.",
  evidence_links: [
    {
      step_id: "Step 4",
      snippet: "HTTP 429: Rate limit exceeded. Retry after 60 seconds",
    },
  ],
  confidence_root_cause: 0.94,
  confidence_factors: 0.91,
  contributing_factors: [
    {
      rank: 1,
      description:
        "No rate limit awareness — agent made rapid sequential API calls",
      evidence_links: [{ step_id: "Step 2" }, { step_id: "Step 3" }, { step_id: "Step 4" }],
    },
    {
      rank: 2,
      description: "No retry logic with exponential backoff",
      evidence_links: [{ step_id: "Step 4" }],
    },
  ],
  counterfactual:
    "If the agent had implemented rate limit handling with exponential backoff, it would have succeeded after waiting.",
  fix_suggestions: [
    {
      category: "tooling",
      description:
        "Add rate limit detection and exponential backoff retry logic",
      evidence_links: [{ step_id: "Step 4" }],
    },
    {
      category: "orchestration",
      description: "Batch API calls or add delays between requests",
      evidence_links: [{ step_id: "Step 2" }],
    },
  ],
};

// Case 5: Tool timeout
const trace5 = "demo-timeout";
const timeoutVerdict: VerdictPack = {
  root_cause:
    "Tool execution timeout — the database_query tool exceeded the 5-second timeout limit while processing a complex join query. The agent did not handle the timeout gracefully.",
  evidence_links: [
    {
      step_id: "Step 3",
      snippet: "TimeoutError: Tool execution exceeded 5000ms",
    },
  ],
  confidence_root_cause: 0.91,
  confidence_factors: 0.87,
  contributing_factors: [
    {
      rank: 1,
      description:
        "Complex query without optimization — agent generated inefficient SQL",
      evidence_links: [{ step_id: "Step 2" }],
    },
    {
      rank: 2,
      description: "No timeout handling or query optimization",
      evidence_links: [{ step_id: "Step 3" }],
    },
  ],
  counterfactual:
    "If the agent had optimized the query or increased the timeout limit, the tool would have completed successfully.",
  fix_suggestions: [
    {
      category: "tooling",
      description: "Increase timeout limit or optimize query generation",
      evidence_links: [{ step_id: "Step 3" }],
    },
    {
      category: "prompt",
      description: "Add instruction to generate optimized SQL queries",
      evidence_links: [{ step_id: "Step 2" }],
    },
  ],
};

// Case 6: Authentication failure
const trace6 = "demo-auth-failure";
const authVerdict: VerdictPack = {
  root_cause:
    "Authentication failure — the payment_api tool rejected the request with HTTP 401 (Unauthorized). The API key expired 2 hours ago, but the agent continued using the cached credentials.",
  evidence_links: [
    {
      step_id: "Step 4",
      snippet: "HTTP 401: Invalid or expired API key",
    },
  ],
  confidence_root_cause: 0.93,
  confidence_factors: 0.89,
  contributing_factors: [
    {
      rank: 1,
      description:
        "Stale credentials — agent used expired API key without refresh",
      evidence_links: [{ step_id: "Step 4" }],
    },
    {
      rank: 2,
      description: "No credential refresh mechanism",
      evidence_links: [{ step_id: "Step 1" }],
    },
  ],
  counterfactual:
    "If the agent had refreshed the API key before making the payment request, the operation would have succeeded.",
  fix_suggestions: [
    {
      category: "orchestration",
      description: "Implement credential refresh before API calls",
      evidence_links: [{ step_id: "Step 4" }],
    },
    {
      category: "tooling",
      description: "Add automatic token refresh on 401 errors",
      evidence_links: [{ step_id: "Step 4" }],
    },
  ],
};

// Case 7: Model contradiction
const trace7 = "demo-contradiction";
const contradictionVerdict: VerdictPack = {
  root_cause:
    "Model output contradiction — the agent first stated 'No flights available' in Step 3, then claimed 'Found 3 flights' in Step 5 without any new tool calls. This contradiction indicates the model hallucinated the second response.",
  evidence_links: [
    {
      step_id: "Step 3",
      snippet: "No flights available for the requested dates",
    },
    {
      step_id: "Step 5",
      snippet: "Found 3 flights matching your criteria",
    },
  ],
  confidence_root_cause: 0.96,
  confidence_factors: 0.92,
  contributing_factors: [
    {
      rank: 1,
      description:
        "Model hallucination — generated contradictory information without tool verification",
      evidence_links: [{ step_id: "Step 5" }],
    },
    {
      rank: 2,
      description: "No fact-checking against tool outputs",
      evidence_links: [{ step_id: "Step 3" }],
    },
  ],
  counterfactual:
    "If the agent had verified tool outputs before generating responses, it would have maintained consistency.",
  fix_suggestions: [
    {
      category: "prompt",
      description:
        "Add instruction to verify tool outputs before generating final responses",
      evidence_links: [{ step_id: "Step 5" }],
    },
    {
      category: "orchestration",
      description: "Implement fact-checking step before model output",
      evidence_links: [{ step_id: "Step 5" }],
    },
  ],
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

const memoryGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "Memory store attempt",
      type: "memory_op",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "Memory retrieval failure",
      type: "memory_op",
      step_id: "Step 3",
    },
    {
      id: "n4",
      label: "Agent uses wrong defaults",
      type: "step",
      step_id: "Step 4",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
    { id: "e3", source: "n3", target: "n4", type: "contradicts" },
  ],
  first_divergence_node_id: "n3",
};

const rateLimitGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "API call 1",
      type: "tool_output",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "API call 2",
      type: "tool_output",
      step_id: "Step 3",
    },
    {
      id: "n4",
      label: "Rate limit exceeded",
      type: "tool_output",
      step_id: "Step 4",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
    { id: "e3", source: "n3", target: "n4", type: "leads_to" },
  ],
  first_divergence_node_id: "n4",
};

const timeoutGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "Query generation",
      type: "step",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "Query timeout",
      type: "tool_output",
      step_id: "Step 3",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
  ],
  first_divergence_node_id: "n3",
};

const authGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "Credential check",
      type: "step",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "Payment API call",
      type: "step",
      step_id: "Step 3",
    },
    {
      id: "n4",
      label: "Auth failure",
      type: "tool_output",
      step_id: "Step 4",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
    { id: "e3", source: "n3", target: "n4", type: "leads_to" },
  ],
  first_divergence_node_id: "n4",
};

const contradictionGraph: CausalGraph = {
  nodes: [
    { id: "n1", label: "User request", type: "step", step_id: "Step 1" },
    {
      id: "n2",
      label: "Flight search",
      type: "tool_output",
      step_id: "Step 2",
    },
    {
      id: "n3",
      label: "Model: No flights",
      type: "step",
      step_id: "Step 3",
    },
    {
      id: "n4",
      label: "No new tool calls",
      type: "step",
      step_id: "Step 4",
    },
    {
      id: "n5",
      label: "Model: Found flights",
      type: "step",
      step_id: "Step 5",
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "depends_on" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
    { id: "e3", source: "n3", target: "n4", type: "depends_on" },
    { id: "e4", source: "n4", target: "n5", type: "contradicts" },
  ],
  first_divergence_node_id: "n5",
};

async function seed() {
  console.log("Seeding demo traces...");

  // Case 1: Date format error
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

  // Case 2: Successful run
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

  // Case 3: Memory retrieval failure
  await storeEvents(trace3, [
    {
      type: "user_input",
      trace_context: { trace_id: trace3 },
      timestamp: now - 20000,
      payload: {
        text: "What's my preferred airline?",
      },
    },
    {
      type: "memory_op",
      trace_context: { trace_id: trace3 },
      timestamp: now - 19500,
      payload: {
        operation: "store",
        key: "user_preferences",
        value: { preferred_airline: "AA" },
      },
    },
    {
      type: "memory_op",
      trace_context: { trace_id: trace3 },
      timestamp: now - 19000,
      payload: {
        operation: "retrieve",
        key: "user_preferences",
        error: "Memory key 'user_preferences' not found",
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace3 },
      timestamp: now - 18500,
      payload: {
        text: "I don't have your preferences saved. Using default airline.",
        token_count: 38,
      },
    },
  ]);

  // Case 4: Rate limit error
  await storeEvents(trace4, [
    {
      type: "user_input",
      trace_context: { trace_id: trace4 },
      timestamp: now - 30000,
      payload: {
        text: "Get weather for NYC, LAX, Chicago, Miami, and Seattle",
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace4 },
      timestamp: now - 29500,
      payload: {
        tool_name: "weather_api",
        input: { city: "NYC" },
        latency_ms: 200,
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace4 },
      timestamp: now - 29300,
      payload: {
        tool_name: "weather_api",
        input: { city: "LAX" },
        latency_ms: 180,
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace4 },
      timestamp: now - 29100,
      payload: {
        tool_name: "weather_api",
        input: { city: "Chicago" },
        latency_ms: 190,
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace4 },
      timestamp: now - 28900,
      payload: {
        tool_name: "weather_api",
        input: { city: "Miami" },
        error: "HTTP 429: Rate limit exceeded. Retry after 60 seconds",
        latency_ms: 150,
      },
    },
  ]);

  // Case 5: Timeout
  await storeEvents(trace5, [
    {
      type: "user_input",
      trace_context: { trace_id: trace5 },
      timestamp: now - 40000,
      payload: {
        text: "Find all users who ordered in the last year with their order history",
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace5 },
      timestamp: now - 39500,
      payload: {
        text: "Generating SQL query to fetch user orders...",
        token_count: 25,
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace5 },
      timestamp: now - 39000,
      payload: {
        tool_name: "database_query",
        input: {
          query:
            "SELECT u.*, o.* FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 1 YEAR) ORDER BY u.id, o.created_at",
        },
        error: "TimeoutError: Tool execution exceeded 5000ms",
        latency_ms: 5000,
      },
    },
  ]);

  // Case 6: Auth failure
  await storeEvents(trace6, [
    {
      type: "user_input",
      trace_context: { trace_id: trace6 },
      timestamp: now - 50000,
      payload: {
        text: "Process payment for order #12345",
      },
    },
    {
      type: "system_state",
      trace_context: { trace_id: trace6 },
      timestamp: now - 49500,
      payload: {
        state: { api_key_expires_at: now - 7200000 },
        reason: "Using cached API credentials",
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace6 },
      timestamp: now - 49000,
      payload: {
        text: "Processing payment...",
        token_count: 20,
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace6 },
      timestamp: now - 48500,
      payload: {
        tool_name: "payment_api",
        input: { order_id: "12345", amount: 99.99 },
        error: "HTTP 401: Invalid or expired API key",
        latency_ms: 300,
      },
    },
  ]);

  // Case 7: Model contradiction
  await storeEvents(trace7, [
    {
      type: "user_input",
      trace_context: { trace_id: trace7 },
      timestamp: now - 60000,
      payload: {
        text: "Find flights from NYC to LAX",
      },
    },
    {
      type: "tool_call",
      trace_context: { trace_id: trace7 },
      timestamp: now - 59500,
      payload: {
        tool_name: "flight_search",
        input: { origin: "NYC", destination: "LAX", date: "2026-02-10" },
        output: { flights: [] },
        latency_ms: 1200,
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace7 },
      timestamp: now - 58000,
      payload: {
        text: "No flights available for the requested dates",
        token_count: 42,
      },
    },
    {
      type: "system_state",
      trace_context: { trace_id: trace7 },
      timestamp: now - 57000,
      payload: {
        state: { tool_calls_made: 1 },
        reason: "No new tool calls",
      },
    },
    {
      type: "model_output",
      trace_context: { trace_id: trace7 },
      timestamp: now - 56000,
      payload: {
        text: "Found 3 flights matching your criteria: Flight AA123 at 8:00 AM, Flight UA456 at 2:00 PM, and Flight DL789 at 6:00 PM.",
        token_count: 78,
      },
    },
  ]);

  // Store reports and status
  await setRunStatus(trace1, {
    status: "failed",
    failure_reason: "Invalid date format in flight_search tool call",
    failure_event_id: "Step 2",
  });
  await storeReport(trace1, badVerdict, badGraph);

  await setRunStatus(trace2, { status: "succeeded" });
  await storeReport(trace2, fixedVerdict, fixedGraph);

  await setRunStatus(trace3, {
    status: "failed",
    failure_reason: "Memory retrieval failure",
    failure_event_id: "Step 3",
  });
  await storeReport(trace3, memoryVerdict, memoryGraph);

  await setRunStatus(trace4, {
    status: "failed",
    failure_reason: "API rate limit exceeded",
    failure_event_id: "Step 4",
  });
  await storeReport(trace4, rateLimitVerdict, rateLimitGraph);

  await setRunStatus(trace5, {
    status: "failed",
    failure_reason: "Tool execution timeout",
    failure_event_id: "Step 3",
  });
  await storeReport(trace5, timeoutVerdict, timeoutGraph);

  await setRunStatus(trace6, {
    status: "failed",
    failure_reason: "Authentication failure",
    failure_event_id: "Step 4",
  });
  await storeReport(trace6, authVerdict, authGraph);

  await setRunStatus(trace7, {
    status: "failed",
    failure_reason: "Model output contradiction",
    failure_event_id: "Step 5",
  });
  await storeReport(trace7, contradictionVerdict, contradictionGraph);

  console.log("✓ Seeded 7 demo traces:");
  console.log("  - demo-bad-run (date format error)");
  console.log("  - demo-fixed-run (success)");
  console.log("  - demo-memory-failure (memory retrieval)");
  console.log("  - demo-rate-limit (API rate limit)");
  console.log("  - demo-timeout (tool timeout)");
  console.log("  - demo-auth-failure (authentication)");
  console.log("  - demo-contradiction (model hallucination)");
  console.log("✓ Run status + verdict + causal graph for all");
  await redis.quit();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
