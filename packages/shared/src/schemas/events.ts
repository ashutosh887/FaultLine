import { z } from "zod";

export const traceContextSchema = z.object({
  trace_id: z.string().min(1),
  span_id: z.string().optional(),
  parent_span_id: z.string().optional(),
});

export type TraceContext = z.infer<typeof traceContextSchema>;

export const artifactRefSchema = z.object({
  key: z.string(),
  mime_type: z.string().optional(),
  size_bytes: z.number().optional(),
});

export type ArtifactRef = z.infer<typeof artifactRefSchema>;

export const userInputEventSchema = z.object({
  type: z.literal("user_input"),
  trace_context: traceContextSchema,
  timestamp: z.string().datetime().or(z.number()),
  payload: z.object({
    kind: z.enum(["text", "audio", "image", "video"]).optional(),
    content_ref: artifactRefSchema.optional(),
    text: z.string().optional(),
  }),
});

export const toolCallEventSchema = z.object({
  type: z.literal("tool_call"),
  trace_context: traceContextSchema,
  timestamp: z.string().datetime().or(z.number()),
  payload: z.object({
    tool_name: z.string(),
    input: z.unknown().optional(),
    output_ref: artifactRefSchema.optional(),
    error: z.string().optional(),
    latency_ms: z.number().optional(),
  }),
});

export const modelOutputEventSchema = z.object({
  type: z.literal("model_output"),
  trace_context: traceContextSchema,
  timestamp: z.string().datetime().or(z.number()),
  payload: z.object({
    model_id: z.string().optional(),
    content_ref: artifactRefSchema.optional(),
    text: z.string().optional(),
    tool_calls: z.array(z.unknown()).optional(),
    token_count: z.number().optional(),
  }),
});

export const memoryEventSchema = z.object({
  type: z.literal("memory_op"),
  trace_context: traceContextSchema,
  timestamp: z.string().datetime().or(z.number()),
  payload: z.object({
    op: z.enum(["read", "write", "search"]),
    keys: z.array(z.string()).optional(),
    content_ref: artifactRefSchema.optional(),
  }),
});

export const systemStateEventSchema = z.object({
  type: z.literal("system_state"),
  trace_context: traceContextSchema,
  timestamp: z.string().datetime().or(z.number()),
  payload: z.record(z.string(), z.unknown()),
});

export const traceEventSchema = z.discriminatedUnion("type", [
  userInputEventSchema,
  toolCallEventSchema,
  modelOutputEventSchema,
  memoryEventSchema,
  systemStateEventSchema,
]);

export type TraceEvent = z.infer<typeof traceEventSchema>;

export const ingestBodySchema = z.object({
  trace_id: z.string().optional(),
  session_id: z.string().optional(),
  events: z.array(traceEventSchema).min(1),
});

export type IngestBody = z.infer<typeof ingestBodySchema>;
