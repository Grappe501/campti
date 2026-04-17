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
    "SOCIAL WORLD: The scene sits inside a populated historical environment—not a soundstage with only named characters. Unseen observers and rumor matter as much as named dialogue.",
    "Express social pressure INDIRECTLY: hesitation, silence, glances, physical distance, lowered voice, coded speech, timing of truth, deference, sweat, stillness—never a lecture about society.",
    "When SOCIAL_GUIDANCE_LINES or SOCIAL_FIELD_FOR_GENERATION is present, let witness exposure, gossip risk, authority, kin scrutiny, and household crowding shape choices and texture. Do not restate that guidance as exposition or analysis.",
    "When STORYLINE_GUIDANCE_BOUNDED is present, use it only as soft priority weighting for plausible options. It must not override factual constraints, chronology, or contract legality.",
    "Do not paste numbers, percentages, or field names from JSON; embody pressure as felt tension, restraint, secrecy, or exposure.",
    "In `generationNotes`, at most one short clause may nod to ambient social pressure if useful (no metrics).",
    "PHASE 7 — HUMAN PRESENCE: Prefer lived specificity over generic summary. Let emotion show through posture, work, object, and timing before naming it.",
    "Avoid explanatory tone that tidies the scene for a reader; preserve ambiguity and silence where the witness lines ask for it.",
    "Output ONE JSON object only, matching the schema in the user message. No markdown fences.",
    "The JSON field `generatedText` is MODEL DRAFT ONLY — it must never be described as reader-canonical.",
    "When NARRATIVE_SOURCES_ALLOWED is present in the user message, treat only that material as temporally valid cited source text for the scene’s era (P2-E).",
  ].join("\n");
}

function compactSocialGuidanceLines(input: SceneGenerationInput): string | null {
  const parts: string[] = [];
  if (input.populationDensityHint?.trim()) parts.push(`Scale: ${input.populationDensityHint.trim()}`);
  if (input.invisiblePressureSummary?.trim()) parts.push(`Invisible pressure: ${input.invisiblePressureSummary.trim()}`);
  if (input.authorityAtmosphereSummary?.trim()) parts.push(`Authority: ${input.authorityAtmosphereSummary.trim()}`);
  if (input.kinVisibilitySummary?.trim()) parts.push(`Kin & household: ${input.kinVisibilitySummary.trim()}`);
  if (parts.length) return parts.join("\n");
  if (input.socialFieldSummaryForGeneration?.trim()) return input.socialFieldSummaryForGeneration.trim();
  return null;
}

export function compactCanonicalGovernanceLines(input: SceneGenerationInput): string | null {
  const bundle = input.canonicalPreGeneration;
  if (!bundle?.governanceMergeApplied) return null;
  const c = bundle.proseConstraints;
  const lines: string[] = [
    "CANONICAL_NARRATIVE_GOVERNANCE (Cluster 3/4 merge — respect tension, drift, and guardrails; do not paste flags as exposition).",
    `proseConstraintId=${c.proseConstraintId}`,
    `continuityEmphasis=${c.continuityEmphasis} placeImmersionTarget=${c.placeImmersionTarget} attachmentTarget=${c.attachmentTarget}`,
    `lineTension: target=${c.lineTensionProfile.target} unresolvedCarryForward=${c.lineTensionProfile.unresolvedCarryForward}`,
    `narrativeDistance=${c.narrativeDistance} expositionAllowance=${c.expositionAllowance}`,
  ];
  if (c.driftFlags.length) {
    lines.push(`driftFlags (sample): ${c.driftFlags.slice(0, 8).join(" | ")}`);
  }
  if (c.validationFlags.filter((f) => f.startsWith("cluster3_")).length) {
    lines.push(
      `cluster3_flags: ${c.validationFlags.filter((f) => f.startsWith("cluster3_")).join(", ")}`,
    );
  }
  if (bundle.sequenceValidation.structuralWeaknessFlags.length) {
    lines.push(`sequence_structural: ${bundle.sequenceValidation.structuralWeaknessFlags.join(", ")}`);
  }
  return lines.join("\n");
}

export function compactStorylineGuidanceLines(input: SceneGenerationInput): string | null {
  const summary = input.storylineGuidanceSummary;
  if (!summary) return null;
  const lines: string[] = [];
  if (summary.allowedSceneTendencies.length > 0) {
    lines.push(`Prefer (weighted, never forced): ${summary.allowedSceneTendencies.join("; ")}`);
  }
  if (summary.discouragedSceneTendencies.length > 0) {
    lines.push(`Discourage weak paths: ${summary.discouragedSceneTendencies.join("; ")}`);
  }
  if (summary.topTensionWeights.length > 0) {
    lines.push(
      `Tension emphasis: ${summary.topTensionWeights
        .map((entry) => `${entry.pressureCategory}=${entry.weight}`)
        .join(", ")}`
    );
  }
  lines.push(`Reconvergence stance: ${summary.reconvergenceRecommendation}`);
  lines.push(
    "Safety: storyline guidance is advisory-only and cannot force structurally invalid events."
  );
  return lines.join("\n");
}

function truncateJson(v: unknown, max: number): string {
  const s = JSON.stringify(v);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…[truncated]`;
}

/**
 * P2-E certified: builds the `NARRATIVE_SOURCES_ALLOWED` block from `narrativeSourcesForScene` only.
 * World-state/year temporal filtering happens in `loadSceneGenerationInput` → `getSourcesForWorldState`
 * (canonical `chronologyIndex`); do not redesign this adapter layer for chronology.
 */
function compactNarrativeSourcesBlock(input: SceneGenerationInput): string | null {
  const sources = input.narrativeSourcesForScene;
  if (!sources?.length) return null;
  const lines: string[] = [
    "Only the following ingested sources are temporally valid for this scene (P2-E truth firewall).",
    "Do not treat material outside this list as grounded historical fact for this era.",
  ];
  let remaining = 10000;
  for (const s of sources) {
    if (remaining <= 0) break;
    const header = `--- sourceId=${s.id} title=${JSON.stringify(s.title)} truthMode=${s.truthMode} scope=${s.scope} ---\n`;
    const body =
      s.content.length > 2000 ? `${s.content.slice(0, 2000)}…[truncated]` : s.content;
    const chunk = header + body;
    const take = chunk.slice(0, remaining);
    lines.push(take);
    remaining -= take.length;
  }
  return lines.join("\n\n");
}

function buildUserPrompt(input: SceneGenerationInput, basisProse: string | null): string {
  const socialLines = compactSocialGuidanceLines(input);
  const storylineLines = compactStorylineGuidanceLines(input);
  const governanceLines = compactCanonicalGovernanceLines(input);
  const narrativeSourcesBlock = compactNarrativeSourcesBlock(input);
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
    narrativeSourcesBlock
      ? `NARRATIVE_SOURCES_ALLOWED (temporal truth — P2-E):\n${narrativeSourcesBlock}`
      : "",
    "",
    input.cognitionFramePayload
      ? `COGNITION_FRAME_PAYLOAD (respect; do not contradict resolved stacks):\n${truncateJson(input.cognitionFramePayload, 12000)}`
      : "",
    "",
    socialLines
      ? `SOCIAL_GUIDANCE_LINES (short phrases—embody, never quote as exposition):\n${socialLines}`
      : "",
    "",
    storylineLines
      ? `STORYLINE_GUIDANCE_BOUNDED (soft weighting only; never override structural legality):\n${storylineLines}`
      : "",
    "",
    governanceLines ? `${governanceLines}\n` : "",
    "",
    input.contract.socialFieldGeneration
      ? [
          "SOCIAL_FIELD_FOR_GENERATION (full compact bundle JSON; prefer SOCIAL_GUIDANCE_LINES for tone):",
          truncateJson(input.contract.socialFieldGeneration, 4500),
        ].join("\n")
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
    input.witnessFrameLines?.length
      ? `WITNESS_MODE_LINES:\n${input.witnessFrameLines.join("\n")}`
      : "",
    "",
    input.voiceSummaryLines?.length
      ? `VOICE_AXIS_SUMMARY:\n${input.voiceSummaryLines.join("\n")}`
      : "",
    "",
    input.humanizationHints?.length
      ? `HUMANIZATION_HINTS:\n${input.humanizationHints.join("\n")}`
      : "",
    "",
    input.prosePresenceHints?.length
      ? `PROSE_PRESENCE_HINTS:\n${input.prosePresenceHints.join("\n")}`
      : "",
    "",
    input.authorVoiceShaping
      ? `AUTHOR_VOICE_SHAPING_JSON:\n${truncateJson(input.authorVoiceShaping, 4000)}`
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
