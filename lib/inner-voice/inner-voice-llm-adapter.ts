import { characterInnerVoiceResponseSchemaV2 } from "@/lib/cognition/inner-voice-contract";
import type { CharacterInnerVoiceRequest, CharacterInnerVoiceResponse } from "@/lib/domain/inner-voice";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

/**
 * Swappable LLM boundary for Phase 5C. Honors `CharacterInnerVoiceRequest` framing:
 * cognition payload is authoritative; the model expresses it as internal thought in English.
 */
export interface InnerVoiceLlmAdapter {
  generateInnerVoice(request: CharacterInnerVoiceRequest): Promise<CharacterInnerVoiceResponse>;
}

export class InnerVoiceLlmAdapterNotImplementedError extends Error {
  constructor() {
    super("InnerVoiceLlmAdapter not wired (Phase 5C)");
    this.name = "InnerVoiceLlmAdapterNotImplementedError";
  }
}

function safeResolvedPayload(payload: Record<string, unknown>): {
  perceivedReality?: string;
  fearStack?: Array<{ rank: number; label: string }>;
  activeMotives?: string[];
} {
  const resolved = payload.resolved;
  if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) return {};
  const r = resolved as Record<string, unknown>;
  return {
    perceivedReality: typeof r.perceivedReality === "string" ? r.perceivedReality : undefined,
    fearStack: Array.isArray(r.fearStack) ? (r.fearStack as Array<{ rank: number; label: string }>) : undefined,
    activeMotives: Array.isArray(r.activeMotives)
      ? (r.activeMotives as string[]).filter((x) => typeof x === "string")
      : undefined,
  };
}

function fallbackResponse(request: CharacterInnerVoiceRequest, note: string): CharacterInnerVoiceResponse {
  const p = request.cognitionFramePayload;
  const rs = safeResolvedPayload(p);
  const fearStack =
    rs.fearStack?.length && rs.fearStack.every((x) => typeof x.label === "string")
      ? rs.fearStack.map((x, i) => ({ rank: i + 1, label: x.label }))
      : [{ rank: 1, label: "Cognition frame present; model output unavailable." }];
  const motives = rs.activeMotives ?? [];
  const desireStack = motives.slice(0, 8).map((label, i) => ({ rank: i + 1, label }));
  return {
    innerMonologue: rs.perceivedReality
      ? `${rs.perceivedReality}\n\n[${note}]`
      : `[${note}]`,
    surfaceThought: "—",
    suppressedThought: "—",
    forbiddenThought: "—",
    selfJustification: "—",
    fearStack,
    desireStack: desireStack.length ? desireStack : [{ rank: 1, label: "—" }],
    contradiction: "—",
    misbeliefs: "—",
    moralFrame: request.worldStateThoughtStyle.summaryForModel.slice(0, 2000),
    ageBand: request.ageBand,
    worldStateStyleSummary: request.worldStateThoughtStyle.summaryForModel,
    confidence: 0.15,
    advisoryOnly: true,
  };
}

function buildSystemPrompt(): string {
  return [
    "You render a single character's INTERNAL thought stream for a historical-fiction author tool.",
    "Output must be ONE JSON object only (no markdown fences, no commentary).",
    "The JSON must match the schema the user message specifies: all string fields filled, fearStack and desireStack are ranked arrays {rank,label}.",
    "Voice: first-person inner cognition only — not spoken dialogue, not narrator description, not stage directions.",
    "Obey the provided cognition frame: do not replace its motives, fears, or moral structure; express and compress them as thought.",
    "Human thought, not prose essays: let lines break, double back, stall, or contradict earlier flashes; a thread can stay unresolved. Partial sentences are allowed inside string values when it serves the mind’s rhythm.",
    "Do not explain emotions cleanly or label them with modern psychology. Show the squeeze of feeling through image, body, oath, rank, kin, weather, work, hunger — as the era allows.",
    "Era and class: use historically plausible thought patterns; avoid modern therapy vocabulary (no 'trauma', 'boundaries', 'process feelings', 'self-care', 'toxic', 'validate', 'mindfulness', 'cope', 'attachment style' as clinical terms) unless worldStateThoughtStyle.avoidModernPsychLabels is false.",
    "Thought-language: English surface; preserve hierarchy, retained key terms, and metaphor systems described in thoughtLanguage.renderInstructions when contract v3 is present.",
    "Embodiment: if embodiment appears in the cognition payload, let pain/fatigue/hunger/illness shorten focus, sharpen irritability, or pull toward relief — without clinical diagnosis.",
    "Desire/attachment: if desire.* appears in cognition-frame-v6, treat yearning, shame-bound want, kin/property/religious pressure, and attachment hunger as real forces — not modern therapy language.",
    "Realism (cognition-frame-v6 realism.*): treat as private steering, not a rubric to quote. Higher fragmentation/interruption → more clipped, uneven inner speech; higher sensory/desire intrusion → more body and want bleeding into word choice; distortion summary → let inference wobble accordingly — still without naming distortions as theory inside the character’s lines.",
    "Unfiltered buckets: when constraint frame marks a mode that surfaces taboo, forbiddenThought may be harsh or profane if the frame requires raw content; still not dialogue.",
    "God-mode: when authorQuestion is set, answer it as internal reflection grounded in the same frame.",
  ].join("\n");
}

function buildUserPrompt(request: CharacterInnerVoiceRequest): string {
  const thoughtBlock =
    request.contractVersion === "3"
      ? {
          thoughtLanguageFrame: {
            renderMode: request.thoughtLanguageFrame.renderMode,
            renderInstructions: request.thoughtLanguageFrame.renderInstructions,
            accentTextureLevel: request.thoughtLanguageFrame.accentTextureLevel,
          },
        }
      : {};

  return [
    "TASK: Produce inner voice JSON.",
    `MODE: ${request.mode}`,
    request.authorQuestion ? `AUTHOR_QUESTION (answer inwardly): ${request.authorQuestion}` : "",
    `AGE_BAND: ${request.ageBand} (assumed=${request.ageBandAssumed})`,
    "",
    "CONSTRAINT_FRAME (obey):",
    JSON.stringify(request.innerVoiceConstraintFrame),
    "",
    "WORLD_STATE_THOUGHT_STYLE:",
    JSON.stringify(request.worldStateThoughtStyle),
    "",
    "AGE_MATURITY_THOUGHT_STYLE:",
    JSON.stringify(request.ageMaturityThoughtStyle),
    "",
    "COGNITION_FRAME_PAYLOAD (authoritative — express, do not invent new plot facts):",
    JSON.stringify(request.cognitionFramePayload),
    "",
    "If payload.realism is present (v6), let thought texture follow it subtly — uneven rhythm, bleed, wobble — without restating these numbers.",
    "",
    "CONTRACT_EXTRAS:",
    JSON.stringify(thoughtBlock),
    "",
    "Return JSON with keys:",
    "innerMonologue, surfaceThought, suppressedThought, forbiddenThought, selfJustification,",
    "fearStack, desireStack, contradiction, misbeliefs, moralFrame, ageBand, worldStateStyleSummary, confidence (0-1), advisoryOnly (boolean).",
    `ageBand must equal ${request.ageBand}.`,
    "Map desireStack labels from active motives / hungers in the frame when relevant; rank most urgent first.",
    "worldStateStyleSummary: one dense paragraph echoing era moral salience from WORLD_STATE_THOUGHT_STYLE.",
  ]
    .filter(Boolean)
    .join("\n");
}

export type OpenAiInnerVoiceAdapterOptions = {
  temperature?: number;
};

export function createOpenAiInnerVoiceAdapter(
  options?: OpenAiInnerVoiceAdapterOptions
): InnerVoiceLlmAdapter {
  const temperature = options?.temperature ?? 0.55;

  return {
    async generateInnerVoice(request: CharacterInnerVoiceRequest): Promise<CharacterInnerVoiceResponse> {
      if (!isOpenAIApiKeyConfigured()) {
        return fallbackResponse(request, "OPENAI_API_KEY missing — advisory stub");
      }

      const openai = getOpenAIClient();
      const model = getConfiguredModelName();

      let content: string | null | undefined;
      try {
        const completion = await openai.chat.completions.create({
          model,
          temperature,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(request) },
          ],
        });
        content = completion.choices[0]?.message?.content;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "OpenAI request failed";
        return fallbackResponse(request, msg);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content ?? "");
      } catch {
        return fallbackResponse(request, "Model returned non-JSON");
      }

      const checked = characterInnerVoiceResponseSchemaV2.safeParse(parsed);
      if (!checked.success) {
        return fallbackResponse(request, "Model JSON failed schema validation");
      }

      const data = checked.data;
      return {
        ...data,
        ageBand: request.ageBand,
        advisoryOnly: true,
      };
    },
  };
}

/** Default OpenAI-backed adapter (requires OPENAI_API_KEY). */
export const openAiInnerVoiceAdapter = createOpenAiInnerVoiceAdapter();

/**
 * @deprecated Prefer `openAiInnerVoiceAdapter` or `createOpenAiInnerVoiceAdapter`.
 * Throws — kept for callers that explicitly expect failure when not wired.
 */
export const notImplementedInnerVoiceAdapter: InnerVoiceLlmAdapter = {
  async generateInnerVoice(_request: CharacterInnerVoiceRequest): Promise<CharacterInnerVoiceResponse> {
    throw new InnerVoiceLlmAdapterNotImplementedError();
  },
};
