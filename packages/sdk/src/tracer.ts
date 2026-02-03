import type { TraceContext, TraceEvent } from "@faultline/shared";

const HEX = "0123456789abcdef";

function randomHex(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += HEX[Math.floor(Math.random() * 16)];
  return out;
}

export function createTraceContext(parent?: TraceContext): TraceContext {
  const trace_id = parent?.trace_id ?? randomHex(32);
  const span_id = randomHex(16);
  const parent_span_id = parent?.span_id;
  return { trace_id, span_id, parent_span_id };
}

function wrapEvent<T extends { type: string; payload: object }>(
  event: T & { timestamp?: string | number },
  context: TraceContext
): T & { trace_context: TraceContext; timestamp: string } {
  const raw = event.timestamp;
  const ts =
    typeof raw === "number"
      ? new Date(raw).toISOString()
      : typeof raw === "string"
        ? raw
        : new Date().toISOString();
  return {
    ...event,
    trace_context: context,
    timestamp: ts,
  } as T & { trace_context: TraceContext; timestamp: string };
}

export interface TracerConfig {
  ingestUrl: string;
  apiKey?: string;
  batch?: boolean;
  flushIntervalMs?: number;
}

export class Tracer {
  private config: TracerConfig;
  private context: TraceContext;
  private buffer: TraceEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: TracerConfig, initialContext?: TraceContext) {
    this.config = config;
    this.context = initialContext ?? createTraceContext();
    if (config.batch && config.flushIntervalMs) {
      this.flushTimer = setInterval(() => this.flush(), config.flushIntervalMs);
    }
  }

  getTraceId(): string {
    return this.context.trace_id;
  }

  getSpanId(): string | undefined {
    return this.context.span_id;
  }

  childContext(): TraceContext {
    return createTraceContext(this.context);
  }

  startNewTrace(): TraceContext {
    this.context = createTraceContext();
    return this.context;
  }

  emit(event: Omit<TraceEvent, "trace_context" | "timestamp"> & { timestamp?: string | number }): void {
    const full = wrapEvent(event as TraceEvent, this.context) as TraceEvent;
    if (this.config.batch) {
      this.buffer.push(full);
    } else {
      this.send([full]);
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];
    await this.send(batch);
  }

  private async send(events: TraceEvent[]): Promise<void> {
    const url = `${this.config.ingestUrl.replace(/\/$/, "")}/api/ingest`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ trace_id: this.context.trace_id, events }),
      });
      if (!res.ok) {
        console.warn("[FaultLine SDK] Ingest failed:", res.status, await res.text());
      }
    } catch (err) {
      console.warn("[FaultLine SDK] Ingest error:", err);
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}
