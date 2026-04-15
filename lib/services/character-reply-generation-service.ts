/**
 * P3-C — Bounded character reply generation: snapshot + turn → {@link CharacterResponse} via OpenAI,
 * then assembly + guardrails + contract registry validation. Author/God mode is out of scope.
 */

import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import type { ConversationalTurnInput } from "@/lib/domain/conversational-turn-input";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";
import {
  prepareCharacterReplyGenerationInput,
  type CharacterReplyGenerationPreparedInput,
} from "@/lib/services/character-reply-generation-adapter";
import {
  assembleCharacterResponseWithDiagnostics,
  type CharacterResponseIntent,
} from "@/lib/services/character-response-assembly-service";
import { assessCharacterResponsePolicyViolations } from "@/lib/services/character-response-guardrail-service";

const MAX_TRANSCRIPT_LINES = 14;
const MAX_SCENE_SOURCE_CHARS = 6000;

export type RecentTurnContextLine = string;

export type CharacterReplyLlmStructuredOutput = {
  spokenResponse: string;
  internalThought: string;
};

export type GenerateCharacterReplyFromTurnParams = {
  snapshot: ConversationalIdentitySnapshot;
  turnInput: ConversationalTurnInput;
  /** Extra transcript lines (e.g. from DB); combined with snapshot session summaries when present. */
  recentTurnContextLines?: RecentTurnContextLine[];
  /** Optional scene-linked narrative source excerpt (caller supplies; not omniscient truth injection). */
  sceneLinkedSourceContext?: string | null;
  responseIntent?: CharacterResponseIntent;
};

export type CharacterReplyGenerationDeps = {
  /**
   * Override LLM call (tests). When omitted, uses OpenAI JSON chat completion when
   * `OPENAI_API_KEY` is set; otherwise the path falls back without calling the network.
   */
  callStructuredReplyLlm?: (input: {
    systemPrompt: string;
    userPrompt: string;
  }) => Promise<CharacterReplyLlmStructuredOutput>;
};

export type GenerateCharacterReplyFromTurnResult = {
  response: CharacterResponse;
  usedLlm: boolean;
  usedPolicyFallback: boolean;
  llmError?: string;
  /** True when the returned {@link CharacterResponse} passes {@link assessCharacterResponsePolicyViolations}. */
  finalPolicyPass: boolean;
  /** True when the model's first candidate was rejected and a conservative fallback was substituted. */
  modelOutputViolatedPolicy?: boolean;
  assemblyClassificationReason?: string;
  policyDowngradedInAssembly?: boolean;
};

const SYSTEM_PROMPT = `You are generating dialogue for a historically bounded fictional character in Campti.
Rules (non-negotiable):
- Stay in-world. No narrator, author, audience, or "as an AI" voice.
- No omniscience about other minds, off-stage facts, or modern global knowledge unless the provided knowledge boundary explicitly supports it.
- No teaching the reader real history from a modern stance; no Wikipedia or lecture posture.
- No explicit future foreknowledge beyond the character's plausible horizon.
- English vs heritage language is presentation-only; do not claim translation is "the soul" of thought.
- Output a single JSON object with exactly two string fields: "spokenResponse" (reader-facing speech) and "internalThought" (short inner line, may be empty).
- spokenResponse must be safe to read aloud; keep internalThought concise.`;

function capSceneSource(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_SCENE_SOURCE_CHARS) return t;
  return `${t.slice(0, MAX_SCENE_SOURCE_CHARS)}…`;
}

function mergeRecentContext(
  snapshot: ConversationalIdentitySnapshot,
  extraLines: RecentTurnContextLine[] | undefined
): string {
  const fromSession = snapshot.sessionContext?.recentTurnSummaries ?? [];
  const merged = [...fromSession, ...(extraLines ?? [])]
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const slice = merged.slice(-MAX_TRANSCRIPT_LINES);
  if (slice.length === 0) {
    return "No prior transcript lines supplied (first turn or unloaded).";
  }
  return slice.map((l, i) => `${i + 1}. ${l}`).join("\n");
}

function buildUserPromptBundle(
  prepared: CharacterReplyGenerationPreparedInput,
  snapshot: ConversationalIdentitySnapshot,
  params: GenerateCharacterReplyFromTurnParams
): string {
  const { sceneLinkedSourceContext, responseIntent } = params;
  const transcriptBlock = mergeRecentContext(snapshot, params.recentTurnContextLines);
  const sceneBlock =
    sceneLinkedSourceContext != null && sceneLinkedSourceContext.trim().length > 0
      ? capSceneSource(sceneLinkedSourceContext)
      : "None supplied; rely on the knowledge boundary and identity sections only.";
  const intent = deriveIntentFromStorylineGuidance(prepared, responseIntent);
  const storylineInteractionLines = compactInteractionStorylineLines(prepared);

  return [
    "=== Bounded generation bundle (deterministic sections) ===",
    "",
    "--- Policy ---",
    prepared.policySummary,
    "",
    "--- Identity ---",
    prepared.identitySummary,
    "",
    "--- Knowledge boundary ---",
    prepared.knowledgeBoundarySummary,
    "",
    "--- Reader relationship memory ---",
    prepared.readerRelationshipMemorySummary,
    "",
    "--- Emotional state ---",
    prepared.emotionalContextSummary,
    "",
    "--- Recent transcript (bounded excerpt, not canonical truth) ---",
    transcriptBlock,
    "",
    "--- Scene-linked source material (witness / cited context; fallible) ---",
    sceneBlock,
    "",
    "--- Reader turn ---",
    prepared.readerPromptText,
    "",
    storylineInteractionLines
      ? `--- Storyline interaction guidance (bounded, non-omniscient) ---\n${storylineInteractionLines}`
      : "",
    "",
    `--- Response intent hint ---`,
    intent,
  ].join("\n");
}

function compactInteractionStorylineLines(
  prepared: CharacterReplyGenerationPreparedInput
): string | null {
  const storyline = prepared.narrativeEmergenceBundle.storylineGuidance;
  if (!storyline) return null;
  const allowed = storyline.sceneTendencyGuidance.allowedSceneTendencies
    .slice(0, 4)
    .map((entry) => entry.split(":").slice(-1)[0] ?? entry);
  const discouraged = storyline.sceneTendencyGuidance.discouragedSceneTendencies
    .slice(0, 4)
    .map((entry) => entry.split(":").slice(-1)[0] ?? entry);
  const topTension = storyline.tensionEmphasisWeights
    .slice(0, 3)
    .map((entry) => `${entry.pressureCategory}=${entry.weight}`);
  const lines = [
    allowed.length > 0 ? `Prefer tendencies: ${allowed.join("; ")}` : null,
    discouraged.length > 0 ? `Discourage weak tendencies: ${discouraged.join("; ")}` : null,
    topTension.length > 0 ? `Tension emphasis weights: ${topTension.join(", ")}` : null,
    `Branch legality: ${storyline.branchConstraints.legalityStatus}; reconvergence: ${storyline.branchConstraints.reconvergenceRecommendation}`,
    "Safety: use as soft weighting only; never claim arc/chapter knowledge in spoken text.",
  ].filter((entry): entry is string => Boolean(entry));
  return lines.join("\n");
}

function deriveIntentFromStorylineGuidance(
  prepared: CharacterReplyGenerationPreparedInput,
  explicitIntent: CharacterResponseIntent | undefined
): CharacterResponseIntent {
  if (explicitIntent && explicitIntent !== "unspecified") return explicitIntent;
  const storyline = prepared.narrativeEmergenceBundle.storylineGuidance;
  if (!storyline) return explicitIntent ?? "unspecified";
  const allowed = storyline.sceneTendencyGuidance.allowedSceneTendencies.join(" ").toLowerCase();
  if (allowed.includes("conflict")) return "reaction";
  if (allowed.includes("disclosure")) return "statement";
  if (allowed.includes("reconciliation") || allowed.includes("intimacy")) return "greeting";
  return explicitIntent ?? "unspecified";
}

function parseStructuredReplyJson(content: string | null | undefined): CharacterReplyLlmStructuredOutput {
  if (content == null || !content.trim()) {
    throw new Error("Empty model content.");
  }
  let raw = content.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const parsed: unknown = JSON.parse(raw);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Model JSON must be an object.");
  }
  const o = parsed as Record<string, unknown>;
  const spoken = o.spokenResponse;
  const internal = o.internalThought;
  if (typeof spoken !== "string" || typeof internal !== "string") {
    throw new Error('Model JSON must include string "spokenResponse" and "internalThought".');
  }
  return { spokenResponse: spoken, internalThought: internal };
}

async function defaultCallOpenAiStructuredReply(input: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<CharacterReplyLlmStructuredOutput> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.35,
  });
  const content = completion.choices[0]?.message?.content;
  return parseStructuredReplyJson(content);
}

/**
 * Conservative in-character reply when the model fails or policy rejects the candidate.
 * Wording avoids meta/omniscience markers checked by guardrails.
 */
export function buildConservativeBoundedCharacterResponse(
  snapshot: ConversationalIdentitySnapshot
): CharacterResponse {
  const spoken =
    "I must answer carefully. There is little I can swear to beyond what my own senses and station allow.";
  const internal =
    "Stay within the fence: in-world voice only—no lecture, no foresight, no privileged sight beyond my place.";
  const assembled = assembleCharacterResponseWithDiagnostics({
    conversationalIdentitySnapshot: snapshot,
    spokenResponseText: spoken,
    internalThoughtText: internal,
    responseIntent: "statement",
  });
  return validateRegisteredContractPayload("characterResponse", assembled.response, "write");
}

export async function generateCharacterReplyFromTurn(
  params: GenerateCharacterReplyFromTurnParams,
  deps?: CharacterReplyGenerationDeps
): Promise<GenerateCharacterReplyFromTurnResult> {
  const { snapshot, turnInput } = params;
  const prepared = prepareCharacterReplyGenerationInput({ snapshot, turnInput });
  const userPrompt = buildUserPromptBundle(prepared, snapshot, params);

  let structured: CharacterReplyLlmStructuredOutput | null = null;
  let llmError: string | undefined;
  let usedLlm = false;

  const caller = deps?.callStructuredReplyLlm;

  try {
    if (caller) {
      structured = await caller({ systemPrompt: SYSTEM_PROMPT, userPrompt });
      usedLlm = true;
    } else if (isOpenAIApiKeyConfigured()) {
      structured = await defaultCallOpenAiStructuredReply({ systemPrompt: SYSTEM_PROMPT, userPrompt });
      usedLlm = true;
    }
  } catch (e) {
    llmError = e instanceof Error ? e.message : "LLM generation failed.";
    structured = null;
  }

  if (!structured) {
    const response = buildConservativeBoundedCharacterResponse(snapshot);
    const pass = assessCharacterResponsePolicyViolations({ snapshot, response }).pass;
    return {
      response,
      usedLlm: false,
      usedPolicyFallback: true,
      llmError,
      finalPolicyPass: pass,
    };
  }

  const assembled = assembleCharacterResponseWithDiagnostics({
    conversationalIdentitySnapshot: snapshot,
    spokenResponseText: structured.spokenResponse,
    internalThoughtText: structured.internalThought,
    responseIntent: params.responseIntent,
  });

  const validated = validateRegisteredContractPayload("characterResponse", assembled.response, "write");
  const combinedOriginal = `${structured.spokenResponse.trim()}\n${structured.internalThought.trim()}`;
  const assessment = assessCharacterResponsePolicyViolations({
    snapshot,
    response: validated,
    originalCombinedText: combinedOriginal,
  });

  if (assessment.pass) {
    return {
      response: validated,
      usedLlm,
      usedPolicyFallback: false,
      finalPolicyPass: true,
      modelOutputViolatedPolicy: false,
      assemblyClassificationReason: assembled.classificationReason,
      policyDowngradedInAssembly: assembled.policyDowngraded,
    };
  }

  const fallback = buildConservativeBoundedCharacterResponse(snapshot);
  const fallbackAssessment = assessCharacterResponsePolicyViolations({ snapshot, response: fallback });
  return {
    response: fallback,
    usedLlm,
    usedPolicyFallback: true,
    llmError: llmError ?? `policy_blocked:${assessment.violations.map((v) => v.code).join(",")}`,
    finalPolicyPass: fallbackAssessment.pass,
    modelOutputViolatedPolicy: true,
    assemblyClassificationReason: assembled.classificationReason,
    policyDowngradedInAssembly: assembled.policyDowngraded,
  };
}
