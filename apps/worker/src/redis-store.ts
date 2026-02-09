import { Redis } from "ioredis";
import type { TraceEvent, VerdictPack, CausalGraph } from "@faultline/shared";

const isUpstash = process.env.REDIS_HOST?.includes("upstash.io");
const redis = new Redis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password: process.env.REDIS_PASSWORD,
  tls: isUpstash
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
const METRICS_JOB_SUCCESS = "faultline:metrics:job_success_total";
const METRICS_JOB_FAILED = "faultline:metrics:job_failed_total";

export async function storeEvents(
  trace_id: string,
  events: TraceEvent[],
): Promise<void> {
  const existing = await getEvents(trace_id);
  const all = [...existing, ...events];
  await redis.set(EVENTS_KEY(trace_id), JSON.stringify(all));
  await redis.sadd(TRACES_KEY, trace_id);
}

export async function getEvents(trace_id: string): Promise<TraceEvent[]> {
  const data = await redis.get(EVENTS_KEY(trace_id));
  return data ? JSON.parse(data) : [];
}

export async function storeReport(
  trace_id: string,
  verdict: VerdictPack | null,
  causal_graph: CausalGraph,
  events_hash?: string,
): Promise<void> {
  await redis.set(
    REPORT_KEY(trace_id),
    JSON.stringify({ verdict, causal_graph, events_hash }),
  );
}

export async function getReport(trace_id: string): Promise<{
  verdict: VerdictPack | null;
  causal_graph: CausalGraph;
  events_hash?: string;
}> {
  const data = await redis.get(REPORT_KEY(trace_id));
  if (!data) {
    return { verdict: null, causal_graph: { nodes: [], edges: [] } };
  }
  return JSON.parse(data);
}

export async function setRunStatus(
  trace_id: string,
  run: { status: string; failure_reason?: string; failure_event_id?: string },
): Promise<void> {
  await redis.set(RUN_KEY(trace_id), JSON.stringify(run));
}

export async function getAllTraceIds(): Promise<string[]> {
  return redis.smembers(TRACES_KEY);
}

export async function incrJobSuccess(): Promise<void> {
  await redis.incr(METRICS_JOB_SUCCESS);
}

export async function incrJobFailed(): Promise<void> {
  await redis.incr(METRICS_JOB_FAILED);
}
