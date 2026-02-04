import { Redis } from "ioredis";
import type { TraceEvent } from "@faultline/shared";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  lazyConnect: true,
});

const EVENTS_KEY = (trace_id: string) => `faultline:events:${trace_id}`;
const TRACES_KEY = "faultline:traces";

async function storeEvents(
  trace_id: string,
  events: TraceEvent[],
): Promise<void> {
  await redis.connect();
  await redis.set(EVENTS_KEY(trace_id), JSON.stringify(events));
  await redis.sadd(TRACES_KEY, trace_id);
}

const trace1 = "demo-bad-run";
const trace2 = "demo-fixed-run";

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

  console.log("✓ Seeded demo traces:", trace1, trace2);
  await redis.quit();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
