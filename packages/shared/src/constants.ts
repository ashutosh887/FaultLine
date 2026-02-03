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
