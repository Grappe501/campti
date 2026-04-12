import { decisionTraceResponseSchemaV2 } from "@/lib/cognition/inner-voice-contract";
import type { DecisionTraceRequest, DecisionTraceResponse } from "@/lib/domain/decision-trace";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

export interface DecisionTraceLlmAdapter {
  generateDecisionTrace(request: DecisionTraceRequest): Promise<DecisionTraceResponse>;
}

function fallbackFromDeterministic(request: DecisionTraceRequest): DecisionTraceResponse {
  const b = request.pressureBreakdown;
  const toP = (xs: { label: string; weight: number }[]) =>
    xs.slice(0, 10).map((x) => ({ label: x.label, weight: x.weight }));

  const enneagram = request.cognitionFramePayload.enneagram as
    | { profile?: { coreDesireEffective?: string } }
    | undefined;
  const coreDesire = enneagram?.profile?.coreDesireEffective?.trim();

  return {
    selectedAction: request.selectedAction.label,
    statedMotive: b.motiveActive[0]?.label ?? "—",
    underlyingMotive: coreDesire?.slice(0, 400) ?? b.desireDrivers[0]?.label ?? "—",
    blockedMotive: b.motiveSuppressed[0]?.label ?? "—",
    triggerPressures: toP(b.triggerPressures),
    dominantPressures: toP(b.motiveActive),
    suppressedPressures: toP(b.motiveSuppressed),
    fearDrivers: toP(b.fearDrivers),
    desireDrivers: toP(b.desireDrivers),
    embodimentDrivers: toP(b.embodimentDrivers),
    worldStateConstraints: b.worldStateConstraints,
    selfDeceptionFactors: b.selfDeceptionFactors,
    contradictionSummary: (() => {
      const idc = request.cognitionFramePayload.resolved as { identityConflict?: string } | undefined;
      const ic = idc?.identityConflict?.slice(0, 400);
      return [ic, request.deterministicScaffolding.summarySkeleton].filter(Boolean).join(" | ").slice(0, 1400);
    })(),
    whyThisWon: request.deterministicScaffolding.summarySkeleton.slice(0, 1200),
    whatCouldChangeIt: request.deterministicScaffolding.alternateCompareSkeleton
      ? [request.deterministicScaffolding.alternateCompareSkeleton.slice(0, 800)]
      : ["Shift pressures in fear/obligation stacks or embodiment load; re-run with alternate scene binding."],
    confidence: 0.2,
    advisoryOnly: true,
  };
}

function buildSystemPrompt(): string {
  return [
    "You write AUTHOR-TOOL explanations of why a historical character would choose an action — not reader-facing prose.",
    "Output ONE JSON object only, matching the schema in the user message.",
    "Ground every claim in the provided cognition frame and pressure breakdown; do not invent plot facts or new relationships.",
    "Distinguish stated motive (what they would say) vs underlying motive (what actually pulls) vs blocked motive (shame/taboo/obligation).",
    "triggerPressures: immediate scene-time spikes that trip the move; dominantPressures: the ranked motive stack — do not duplicate the full fear stack into triggers.",
    "Preserve contradiction: a choice can oppose conscious preference.",
    "No modern therapy vocabulary unless worldStateStyleSummary explicitly allows it.",
    "Era-appropriate moral language: honor, shame, kin, law, covenant, station, hunger, God/omen only when frame supports.",
  ].join("\n");
}

function buildUserPrompt(request: DecisionTraceRequest): string {
  return [
    "TASK: Decision trace JSON.",
    JSON.stringify({
      schemaHint: {
        selectedAction: "string label",
        statedMotive: "string",
        underlyingMotive: "string",
        blockedMotive: "string",
        triggerPressures: [{ label: "string", weight: 0 }],
        dominantPressures: [{ label: "string", weight: 0 }],
        suppressedPressures: [{ label: "string", weight: 0 }],
        fearDrivers: [{ label: "string", weight: 0 }],
        desireDrivers: [{ label: "string", weight: 0 }],
        embodimentDrivers: [{ label: "string", weight: 0 }],
        worldStateConstraints: "copy from request.pressureBreakdown.worldStateConstraints (may refine labels only)",
        selfDeceptionFactors: "array of strings",
        contradictionSummary: "string",
        whyThisWon: "string — tight paragraph",
        whatCouldChangeIt: ["string"],
        confidence: "0-1",
        advisoryOnly: true,
      },
    }),
    "",
    "DETERMINISTIC_SCAFFOLD (respect, do not contradict):",
    request.deterministicScaffolding.summarySkeleton,
    request.deterministicScaffolding.alternateCompareSkeleton
      ? `ALTERNATE_COMPARE: ${request.deterministicScaffolding.alternateCompareSkeleton}`
      : "",
    "",
    "PRESSURE_BREAKDOWN:",
    JSON.stringify(request.pressureBreakdown),
    "",
    "COGNITION_FRAME_PAYLOAD:",
    JSON.stringify(request.cognitionFramePayload),
    "",
    "WORLD_STYLE_SUMMARY:",
    request.worldStateStyleSummary,
    "",
    `SELECTED_ACTION: ${request.selectedAction.label}`,
    request.alternateAction ? `ALTERNATE_ACTION: ${request.alternateAction.label}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createOpenAiDecisionTraceAdapter(): DecisionTraceLlmAdapter {
  return {
    async generateDecisionTrace(request: DecisionTraceRequest): Promise<DecisionTraceResponse> {
      const fb = fallbackFromDeterministic(request);
      if (!isOpenAIApiKeyConfigured()) return fb;

      let content: string | null | undefined;
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: getConfiguredModelName(),
          temperature: 0.45,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(request) },
          ],
        });
        content = completion.choices[0]?.message?.content;
      } catch {
        return fb;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content ?? "");
      } catch {
        return fb;
      }

      const checked = decisionTraceResponseSchemaV2.safeParse(parsed);
      if (!checked.success) return fb;

      return {
        ...checked.data,
        advisoryOnly: true,
      };
    },
  };
}

export const openAiDecisionTraceAdapter = createOpenAiDecisionTraceAdapter();
