import { z } from "zod";

import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationOutputV1, SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";
import { SCENE_GENERATION_OUTPUT_VERSION } from "@/lib/domain/scene-generation-output";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

const sceneGenerationOutputSchemaV1 = z.object({
  contractVersion: z.literal("1"),
  generatedText: z.string(),
  generationNotes: z.string(),
  warnings: z.array(z.string()),
  continuityFlags: z.array(z.string()),
});

function purposeLabel(p: SceneGenerationPurpose): string {
  switch (p) {
    case "author_draft":
      return "AUTHOR_DRAFT — write a first AI draft from structured facts only.";
    case "prose_rewrite":
      return "PROSE_REWRITE — revise the supplied baseline prose toward goals; keep genealogical and world facts.";
    case "continuity_repair":
      return "CONTINUITY_REPAIR — fix continuity against notes and assertions; preserve voice goals.";
    case "alternate_branch":
      return "ALTERNATE_BRANCH — explore a plausible alternate beat consistent with facts (still not canon until promoted).";
    default:
      return String(p);
  }
}

function buildSystemPrompt(): string {
  return [
    "You are a historical-fiction scene writer inside an AUTHORING TOOL.",
    "Ground every plot-impacting claim in the JSON contract: genealogical assertions, people, place, world-state era.",
    "Respect thought-language mediation and cognition summaries when provided: no modern therapy vocabulary unless era-appropriate.",
    "Embodiment, desire pressure, and fear stacks may inform texture but must not contradict structured facts.",
    "Output ONE JSON object only, matching the schema in the user message. No markdown fences.",
    "The JSON field `generatedText` is MODEL DRAFT ONLY — it must never be described as reader-canonical.",
  ].join("\n");
}

function truncateJson(v: unknown, max: number): string {
  const s = JSON.stringify(v);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…[truncated]`;
}

function buildUserPrompt(input: SceneGenerationInput, basisProse: string | null): string {
  return [
    `GENERATION_MODE: ${input.generationMode}`,
    `GENERATION_PURPOSE: ${purposeLabel(input.generationPurpose)}`,
    "",
    "SCHEMA_OUTPUT:",
    JSON.stringify({
      contractVersion: "1",
      generatedText: "string — scene prose, plain paragraphs",
      generationNotes: "string — brief author-facing notes",
      warnings: ["string"],
      continuityFlags: ["string"],
    }),
    "",
    "CONTRACT_JSON:",
    truncateJson(input.contract, 28000),
    "",
    input.cognitionFramePayload
      ? `COGNITION_FRAME_PAYLOAD (respect; do not contradict resolved stacks):\n${truncateJson(input.cognitionFramePayload, 12000)}`
      : "",
    "",
    input.pinnedDecisionTracePayload
      ? `PINNED_DECISION_TRACE_JSON:\n${truncateJson(input.pinnedDecisionTracePayload, 8000)}`
      : "",
    "",
    basisProse
      ? `BASELINE_PROSE (rewrite/repair from this when present):\n${basisProse.slice(0, 32000)}`
      : "",
    "",
    "AUTHOR_GOALS_AND_QA_CONTEXT:",
    truncateJson(input.proseQaContext, 6000),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateSceneProseWithModel(
  input: SceneGenerationInput,
  basisProse: string | null
): Promise<SceneGenerationOutputV1> {
  if (!isOpenAIApiKeyConfigured()) {
    throw new Error("OPENAI_API_KEY is not set; cannot generate scene prose.");
  }

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    temperature: 0.65,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input, basisProse) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? "");
  } catch {
    throw new Error("Scene generation returned non-JSON output.");
  }

  const checked = sceneGenerationOutputSchemaV1.safeParse(parsed);
  if (!checked.success) {
    throw new Error("Scene generation JSON failed schema validation.");
  }

  return {
    contractVersion: SCENE_GENERATION_OUTPUT_VERSION,
    generatedText: checked.data.generatedText.trim(),
    generationNotes: checked.data.generationNotes.trim(),
    warnings: checked.data.warnings,
    continuityFlags: checked.data.continuityFlags,
    advisoryOnly: true,
  };
}

/** @deprecated Prefer `generateSceneProseWithModel`; thin aliases preserved for API clarity. */
export async function generateSceneDraft(
  input: SceneGenerationInput,
  basisProse: string | null
): Promise<SceneGenerationOutputV1> {
  return generateSceneProseWithModel(input, basisProse);
}

export async function rewriteSceneDraft(
  input: SceneGenerationInput,
  basisProse: string | null
): Promise<SceneGenerationOutputV1> {
  return generateSceneProseWithModel(input, basisProse);
}

export async function repairSceneContinuity(
  input: SceneGenerationInput,
  basisProse: string | null
): Promise<SceneGenerationOutputV1> {
  return generateSceneProseWithModel(input, basisProse);
}
