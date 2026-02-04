import { Redis } from "ioredis";
import type { TraceEvent, VerdictPack, CausalGraph } from "@faultline/shared";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
      lazyConnect: true,
      retryStrategy: () => null,
    });
  }
  return redis;
}

const EVENTS_KEY = (trace_id: string) => `faultline:events:${trace_id}`;
const REPORT_KEY = (trace_id: string) => `faultline:report:${trace_id}`;
const TRACES_KEY = "faultline:traces";

export async function storeEvents(
  trace_id: string,
  events: TraceEvent[],
): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const existing = await getEvents(trace_id);
  const all = [...existing, ...events];
  await r.set(EVENTS_KEY(trace_id), JSON.stringify(all));
  await r.sadd(TRACES_KEY, trace_id);
}

export async function getEvents(trace_id: string): Promise<TraceEvent[]> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const data = await r.get(EVENTS_KEY(trace_id));
  return data ? JSON.parse(data) : [];
}

export async function getReport(trace_id: string): Promise<{
  verdict: VerdictPack | null;
  causal_graph: CausalGraph;
}> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const data = await r.get(REPORT_KEY(trace_id));
  if (!data) {
    return { verdict: null, causal_graph: { nodes: [], edges: [] } };
  }
  return JSON.parse(data);
}

export async function getAllTraceIds(): Promise<string[]> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  return r.smembers(TRACES_KEY);
}
