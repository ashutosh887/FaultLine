import { z } from "zod";

export const evidenceLinkSchema = z.object({
  step_id: z.string(),
  artifact_key: z.string().optional(),
  snippet: z.string().optional(),
});

export type EvidenceLink = z.infer<typeof evidenceLinkSchema>;

export const verdictPackSchema = z.object({
  root_cause: z.string(),
  evidence_links: z.array(evidenceLinkSchema).min(1),
  confidence_root_cause: z.number().min(0).max(1).optional(),
  confidence_factors: z.number().min(0).max(1).optional(),
  contributing_factors: z.array(
    z.object({
      rank: z.number(),
      description: z.string(),
      evidence_links: z.array(evidenceLinkSchema),
    }),
  ),
  counterfactual: z.string().optional(),
  contradictions: z
    .array(
      z.object({
        claim_a: z.string(),
        claim_b: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  fix_suggestions: z.array(
    z.object({
      category: z.enum([
        "prompt",
        "tooling",
        "memory",
        "orchestration",
        "safety",
      ]),
      description: z.string(),
      evidence_links: z.array(evidenceLinkSchema).optional(),
    }),
  ),
});

export type VerdictPack = z.infer<typeof verdictPackSchema>;

export const causalNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["step", "assumption", "tool_output", "decision"]).optional(),
  step_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const causalEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(["depends_on", "contradicts", "leads_to"]).optional(),
});

export const causalGraphSchema = z.object({
  nodes: z.array(causalNodeSchema),
  edges: z.array(causalEdgeSchema),
  first_divergence_node_id: z.string().optional(),
});

export type CausalGraph = z.infer<typeof causalGraphSchema>;
