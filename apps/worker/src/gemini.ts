import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TraceEvent, VerdictPack, CausalGraph } from "@faultline/shared";
import { verdictPackSchema, causalGraphSchema } from "@faultline/shared";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(apiKey);

function getResponseSchema() {
  return {
    type: "object",
    properties: {
      verdict: {
        type: "object",
        properties: {
          root_cause: {
            type: "string",
            description: "Primary reason for failure",
          },
          confidence_root_cause: {
            type: "number",
            description: "Confidence in root cause 0-1",
          },
          confidence_factors: {
            type: "number",
            description: "Confidence in contributing factors 0-1",
          },
          evidence_links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_id: {
                  type: "string",
                  description: "Step number like 'Step 1'",
                },
                artifact_key: { type: "string" },
                snippet: {
                  type: "string",
                  description: "Relevant quote from the step",
                },
              },
              required: ["step_id"],
            },
          },
          contributing_factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: {
                  type: "number",
                  description: "Rank 1-5, 1 is most important",
                },
                description: { type: "string" },
                evidence_links: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step_id: { type: "string" },
                      artifact_key: { type: "string" },
                      snippet: { type: "string" },
                    },
                    required: ["step_id"],
                  },
                },
              },
              required: ["rank", "description", "evidence_links"],
            },
          },
          counterfactual: { type: "string", description: "If-then statement" },
          contradictions: {
            type: "array",
            description: "Inconsistent claims in trace (if any)",
            items: {
              type: "object",
              properties: {
                claim_a: { type: "string" },
                claim_b: { type: "string" },
                description: { type: "string" },
              },
              required: ["claim_a", "claim_b"],
            },
          },
          fix_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: [
                    "prompt",
                    "tooling",
                    "memory",
                    "orchestration",
                    "safety",
                  ],
                },
                description: { type: "string" },
                evidence_links: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step_id: { type: "string" },
                      artifact_key: { type: "string" },
                      snippet: { type: "string" },
                    },
                    required: ["step_id"],
                  },
                },
              },
              required: ["category", "description"],
            },
          },
        },
        required: [
          "root_cause",
          "evidence_links",
          "contributing_factors",
          "fix_suggestions",
        ],
      },
      causal_graph: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                type: {
                  type: "string",
                  enum: ["step", "assumption", "tool_output", "decision"],
                },
                step_id: { type: "string" },
                metadata: { type: "object", additionalProperties: true },
              },
              required: ["id", "label"],
            },
          },
          edges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                source: { type: "string" },
                target: { type: "string" },
                type: {
                  type: "string",
                  enum: ["depends_on", "contradicts", "leads_to"],
                },
              },
              required: ["id", "source", "target"],
            },
          },
          first_divergence_node_id: { type: "string" },
        },
        required: ["nodes", "edges"],
      },
    },
    required: ["verdict", "causal_graph"],
  };
}

function getModel() {
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: getResponseSchema() as any,
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });
}

const MAX_EVENTS_FOR_ANALYSIS = 80;
const TOKEN_ESTIMATE_CHARS = 4;

function sliceRelevantEvents(events: TraceEvent[]): TraceEvent[] {
  if (events.length <= MAX_EVENTS_FOR_ANALYSIS) return events;
  const kept = new Set<number>();
  for (let i = 0; i < 40 && i < events.length; i++) kept.add(i);
  events.forEach((e, i) => {
    if (e.type === "tool_call" && (e.payload as { error?: string }).error)
      kept.add(i);
  });
  for (let i = Math.max(0, events.length - 40); i < events.length; i++)
    kept.add(i);
  const indices = [...kept].sort((a, b) => a - b);
  return indices.map((i) => events[i]);
}

function formatEventsForPrompt(events: TraceEvent[]): string {
  return events
    .map((e, i) => {
      const ts =
        typeof e.timestamp === "number"
          ? new Date(e.timestamp).toISOString()
          : e.timestamp;
      const payloadStr = JSON.stringify(e.payload, null, 2);
      return `Step ${i + 1} [${e.type}] (${ts}):\n${payloadStr}`;
    })
    .join("\n\n");
}

function buildPrompt(events: TraceEvent[]): string {
  const sliced = sliceRelevantEvents(events);
  const truncatedNote =
    events.length > sliced.length
      ? `\n[Note: Trace truncated from ${events.length} to ${sliced.length} events for analysis. Error events and head/tail preserved.]\n\n`
      : "";
  return `You are a root-cause analysis expert for AI agent systems. Analyze the following trace of events and produce a structured forensic report.
${truncatedNote}
Trace events:
${formatEventsForPrompt(sliced)}

Analyze this trace and identify:
1. Root cause: What was the primary reason for failure or unexpected behavior? Be specific and reference step numbers.
2. Evidence links: Reference specific step IDs (use "Step 1", "Step 2", etc.) and include relevant snippets from those steps.
3. Contributing factors: Rank the top 3-5 factors (rank 1 = most important) that contributed to the issue. Each must have evidence links.
4. Counterfactual: What would have changed the outcome? Use "If X, then Y" format.
5. Fix suggestions: Provide 2-4 actionable fixes, categorized as: prompt, tooling, memory, orchestration, or safety. Each should reference evidence.

Build a causal graph showing:
- Nodes: Each significant step, assumption, tool output, or decision point
- Edges: Show dependencies (depends_on), contradictions (contradicts), or causal chains (leads_to)
- First divergence: Identify the node ID where failure first became inevitable

Provide confidence_root_cause and confidence_factors as numbers between 0 and 1 (how confident you are in the root cause and in the contributing factors).

Contradiction check: If the trace contains inconsistent claims (e.g., model says X in one step but Y in another, or tool output contradicts earlier assumptions), list them in contradictions array with claim_a and claim_b. Use empty array [] if none.

Return structured JSON with "verdict" and "causal_graph" keys matching the provided schema.`;
}

export async function analyzeTrace(
  trace_id: string,
  events: TraceEvent[],
): Promise<{ verdict: VerdictPack; causal_graph: CausalGraph }> {
  if (events.length === 0) {
    throw new Error("Cannot analyze empty trace");
  }

  const model = getModel();
  const prompt = buildPrompt(events);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed: { verdict?: unknown; causal_graph?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(
        `Invalid JSON in Gemini response: ${text.substring(0, 200)}`,
      );
    }

    if (!parsed.verdict || !parsed.causal_graph) {
      throw new Error(
        `Missing verdict or causal_graph. Got keys: ${Object.keys(parsed).join(", ")}`,
      );
    }

    const verdict = verdictPackSchema.parse(parsed.verdict);
    const causal_graph = causalGraphSchema.parse(parsed.causal_graph);

    return { verdict, causal_graph };
  } catch (error) {
    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      throw error;
    }
    throw new Error(
      `Gemini analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
