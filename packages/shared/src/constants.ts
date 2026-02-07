export const INGEST_MAX_BODY_BYTES = 1 * 1024 * 1024;
export const GEMINI_MAX_OUTPUT_TOKENS = 4096;

export const FORENSICS_QUEUE_NAME = "faultline:forensics";
export const FORENSICS_DLQ_NAME = "faultline:forensics:failed";

export const INGEST_RATE_LIMIT_WINDOW_MS = 60_000;
export const INGEST_RATE_LIMIT_MAX_REQUESTS = 100;

export const EVENT_TYPES = [
  "user_input",
  "tool_call",
  "model_output",
  "memory_op",
  "system_state",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const FIX_CATEGORIES = [
  "prompt",
  "tooling",
  "memory",
  "orchestration",
  "safety",
] as const;

export type FixCategory = (typeof FIX_CATEGORIES)[number];
