import { createHash } from "crypto";
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
const PROJECT_TRACES_KEY = (project_id: string) =>
  `faultline:project:${project_id}:traces`;
const TRACE_PROJECT_KEY = (trace_id: string) =>
  `faultline:trace_project:${trace_id}`;
const REPLAY_KEY = (trace_id: string) => `faultline:replay:${trace_id}`;
const ARTIFACT_KEY = (id: string) => `faultline:artifact:${id}`;
const METRICS_INGEST = "faultline:metrics:ingest_total";
const METRICS_JOB_SUCCESS = "faultline:metrics:job_success_total";
const METRICS_JOB_FAILED = "faultline:metrics:job_failed_total";
const METRICS_INGEST_TS = "faultline:metrics:ingest_ts";

const ARTIFACT_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/",
  "audio/",
  "video/",
  "text/",
  "application/json",
  "application/pdf",
  "application/octet-stream",
];

function isValidContentType(ct: string): boolean {
  return ALLOWED_CONTENT_TYPES.some(
    (allowed) => ct === allowed || ct.startsWith(allowed.replace("*", "")),
  );
}

export async function storeArtifact(
  id: string,
  content_type: string,
  data: Buffer,
): Promise<void> {
  if (data.length > ARTIFACT_MAX_BYTES) {
    throw new Error("Artifact too large");
  }
  const ct = content_type || "application/octet-stream";
  if (!isValidContentType(ct)) {
    throw new Error(`Invalid content type: ${ct}`);
  }
  const sha256 = createHash("sha256").update(data).digest("hex");
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  await r.set(
    ARTIFACT_KEY(id),
    JSON.stringify({
      content_type: ct,
      data_base64: data.toString("base64"),
      sha256,
    }),
  );
}

export async function getArtifact(
  id: string,
): Promise<{ content_type: string; data: Buffer; sha256?: string } | null> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const raw = await r.get(ARTIFACT_KEY(id));
  if (!raw) return null;
  const { content_type, data_base64, sha256 } = JSON.parse(raw);
  const data = Buffer.from(data_base64, "base64");
  if (sha256) {
    const actual = createHash("sha256").update(data).digest("hex");
    if (actual !== sha256) throw new Error("Artifact checksum mismatch");
  }
  return {
    content_type: content_type ?? "application/octet-stream",
    data,
    sha256,
  };
}

export type RunStatus = {
  status: "running" | "failed" | "completed" | "succeeded";
  failure_reason?: string;
  failure_event_id?: string;
  project_id?: string;
};

export async function getRunStatus(
  trace_id: string,
): Promise<RunStatus | null> {
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

function eventKey(e: TraceEvent): string {
  const ts =
    typeof e.timestamp === "number"
      ? e.timestamp
      : new Date(e.timestamp).getTime();
  return `${ts}:${e.type}:${JSON.stringify(e.payload)}`;
}

function sortEvents(events: TraceEvent[]): TraceEvent[] {
  return [...events].sort((a, b) => {
    const ta =
      typeof a.timestamp === "number"
        ? a.timestamp
        : new Date(a.timestamp).getTime();
    const tb =
      typeof b.timestamp === "number"
        ? b.timestamp
        : new Date(b.timestamp).getTime();
    return ta - tb;
  });
}

export async function storeEvents(
  trace_id: string,
  events: TraceEvent[],
  project_id = "default",
  replay = false,
): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const isReplay = await r.get(REPLAY_KEY(trace_id));
  if (isReplay && !replay) {
    throw new Error("Trace is frozen (replay mode); cannot append events");
  }
  if (replay) {
    const all = sortEvents(events);
    await r.set(EVENTS_KEY(trace_id), JSON.stringify(all));
    await r.set(REPLAY_KEY(trace_id), "1");
  } else {
    const existing = await getEvents(trace_id);
    const existingKeys = new Set(existing.map(eventKey));
    const newEvents = events.filter((e) => !existingKeys.has(eventKey(e)));
    const all = sortEvents([...existing, ...newEvents]);
    await r.set(EVENTS_KEY(trace_id), JSON.stringify(all));
  }
  await r.sadd(TRACES_KEY, trace_id);
  await r.sadd(PROJECT_TRACES_KEY(project_id), trace_id);
  await r.set(TRACE_PROJECT_KEY(trace_id), project_id);
}

export async function getEvents(trace_id: string): Promise<TraceEvent[]> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const data = await r.get(EVENTS_KEY(trace_id));
  const events = data ? JSON.parse(data) : [];
  return sortEvents(events);
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

export async function getAllTraceIds(project_id?: string): Promise<string[]> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  if (project_id) {
    return r.smembers(PROJECT_TRACES_KEY(project_id));
  }
  return r.smembers(TRACES_KEY);
}

export async function isArtifactInTrace(
  trace_id: string,
  artifact_id: string,
): Promise<boolean> {
  const events = await getEvents(trace_id);
  for (const e of events) {
    const payload = e.payload as { content_ref?: { key?: string } };
    if (payload?.content_ref?.key === artifact_id) return true;
  }
  const { verdict } = await getReport(trace_id);
  if (verdict) {
    const links = [
      ...verdict.evidence_links,
      ...verdict.contributing_factors.flatMap((f) => f.evidence_links),
      ...(verdict.fix_suggestions ?? []).flatMap((f) => f.evidence_links ?? []),
    ];
    if (links.some((l) => l.artifact_key === artifact_id)) return true;
  }
  return false;
}

export async function checkRedis(): Promise<boolean> {
  const r = getRedis();
  try {
    await r.connect();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}

export async function incrIngestCount(): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  await r.incr(METRICS_INGEST);
  const now = Date.now();
  await r.lpush(METRICS_INGEST_TS, String(now));
  await r.ltrim(METRICS_INGEST_TS, 0, 999);
}

export async function getMetrics(): Promise<{
  ingest_total: number;
  ingest_qps: number;
  job_success_total: number;
  job_failed_total: number;
  job_success_rate: number;
}> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const [ingestTotal, jobSuccess, jobFailed, tsList] = await Promise.all([
    r.get(METRICS_INGEST),
    r.get(METRICS_JOB_SUCCESS),
    r.get(METRICS_JOB_FAILED),
    r.lrange(METRICS_INGEST_TS, 0, -1),
  ]);
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const recentIngests = (tsList ?? []).filter(
    (ts) => parseInt(ts, 10) >= oneMinuteAgo,
  );
  const ingest_total = parseInt(ingestTotal ?? "0", 10);
  const job_success_total = parseInt(jobSuccess ?? "0", 10);
  const job_failed_total = parseInt(jobFailed ?? "0", 10);
  const total = job_success_total + job_failed_total;
  return {
    ingest_total,
    ingest_qps: recentIngests.length / 60,
    job_success_total,
    job_failed_total,
    job_success_rate: total > 0 ? job_success_total / total : 0,
  };
}

export async function incrJobSuccess(): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  await r.incr(METRICS_JOB_SUCCESS);
}

export async function incrJobFailed(): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  await r.incr(METRICS_JOB_FAILED);
}

export async function deleteTrace(trace_id: string): Promise<void> {
  const r = getRedis();
  try {
    await r.connect();
  } catch {}
  const project_id = await r.get(TRACE_PROJECT_KEY(trace_id));
  await Promise.all([
    r.del(EVENTS_KEY(trace_id)),
    r.del(REPORT_KEY(trace_id)),
    r.del(RUN_KEY(trace_id)),
    r.del(TRACE_PROJECT_KEY(trace_id)),
    r.del(REPLAY_KEY(trace_id)),
    r.srem(TRACES_KEY, trace_id),
    ...(project_id ? [r.srem(PROJECT_TRACES_KEY(project_id), trace_id)] : []),
  ]);
}
