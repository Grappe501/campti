/**
 * Optional hooks for future LLM-assisted inference — no OpenAI required at import time.
 * Callers should check env and model availability before invoking.
 */

export type EnneagramInferenceAssistInput = {
  personId: string;
  profileSummary?: string;
};

export async function runEnneagramInferenceAssist(_input: EnneagramInferenceAssistInput): Promise<{
  ok: false;
  reason: string;
}> {
  return { ok: false, reason: "Stub — wire to your model provider when ready; do not block builds." };
}

export type EmbodiedPerspectiveAssistInput = {
  personId: string;
  placeId: string;
  metaSceneId?: string | null;
};

export async function runEmbodiedPerspectiveAssist(_input: EmbodiedPerspectiveAssistInput): Promise<{
  ok: false;
  reason: string;
}> {
  return { ok: false, reason: "Stub — deterministic engines cover baseline; LLM optional for nuance." };
}

export type SceneSoulAssistInput = {
  metaSceneId: string;
};

export async function runSceneSoulAssist(_input: SceneSoulAssistInput): Promise<{
  ok: false;
  reason: string;
}> {
  return { ok: false, reason: "Stub — use composeStructuredScenePass + refreshSoulSuggestionsAction." };
}

export type SceneSoulAssistResult = { ok: true; text: string } | { ok: false; reason: string };
