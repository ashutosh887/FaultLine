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
const RUN_KEY = (trace_id: string) => `faultline:run:${trace_id}`;
const TRACES_KEY = "faultline:traces";
const ARTIFACT_KEY = (id: string) => `faultline:artifact:${id}`;

const ARTIFACT_MAX_BYTES = 5 * 1024 * 1024;

export async function storeArtifact(
  id: string,
  content_type: string,
  data: Buffer,
): Promise<void> {
  if (data.length > ARTIFACT_MAX_BYTES) {
    throw new Error("Artifact too large");
  }
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  await r.set(
    ARTIFACT_KEY(id),
    JSON.stringify({
      content_type,
      data_base64: data.toString("base64"),
    }),
  );
}

export async function getArtifact(
  id: string,
): Promise<{ content_type: string; data: Buffer } | null> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const raw = await r.get(ARTIFACT_KEY(id));
  if (!raw) return null;
  const { content_type, data_base64 } = JSON.parse(raw);
  return {
    content_type: content_type ?? "application/octet-stream",
    data: Buffer.from(data_base64, "base64"),
  };
}

export type RunStatus = {
  status: "running" | "failed" | "completed";
  failure_reason?: string;
  failure_event_id?: string;
};

export async function getRunStatus(trace_id: string): Promise<RunStatus | null> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const data = await r.get(RUN_KEY(trace_id));
  return data ? JSON.parse(data) : null;
}

export async function setRunStatus(
  trace_id: string,
  run: RunStatus,
): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  await r.set(RUN_KEY(trace_id), JSON.stringify(run));
}

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
