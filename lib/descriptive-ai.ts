import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { describeWorldStateRichly, describePerspectiveRichly, describeFragmentRichly, describeClusterRichly } from "@/lib/descriptive-synthesis";
import {
  buildWorldStateDescriptionPrompt,
  buildPerspectiveDescriptionPrompt,
  buildSoulSuggestionPrompt,
  buildFragmentInterpretationPrompt,
  buildRelationshipNarrativePrompt,
  buildClusterSummaryPrompt,
} from "@/lib/descriptive-prompts";
import { validateEnhancedDescriptionOutput } from "@/lib/descriptive-validation";
import type { NarrativeStylePreset } from "@/lib/descriptive-validation";
import { DEFAULT_SUGGESTION_STYLE, DEFAULT_WORLD_PREVIEW_STYLE, DEFAULT_SOURCE_GROUNDED_STYLE } from "@/lib/narrative-style";

export type EnhanceResult = { ok: true; text: string } | { ok: false; error: string; skipped?: boolean };

async function runPrompt(prompt: string): Promise<EnhanceResult> {
  if (!isOpenAIApiKeyConfigured()) {
    return { ok: false, error: "OPENAI_API_KEY is not set.", skipped: true };
  }
  try {
    const client = getOpenAIClient();
    const res = await client.chat.completions.create({
      model: getConfiguredModelName(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.45,
      max_tokens: 4096,
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    const v = validateEnhancedDescriptionOutput(text);
    if (!v.ok) return { ok: false, error: v.error };
    return { ok: true, text: v.text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed.";
    return { ok: false, error: msg };
  }
}

export async function enhanceWorldStateDescription(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<EnhanceResult> {
  const rich = await describeWorldStateRichly(metaSceneId, style);
  if (!rich) return { ok: false, error: "Meta scene not found." };
  const baseline = [
    rich.povSummary,
    rich.environmentSummary,
    rich.emotionalContext,
    rich.constraintsSummary,
    rich.symbolicSummary,
  ].join("\n\n---\n\n");
  const prompt = buildWorldStateDescriptionPrompt({ baseline, style });
  return runPrompt(prompt);
}

export async function enhancePerspectiveDescription(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<EnhanceResult> {
  const baseline = await describePerspectiveRichly(metaSceneId, style);
  const prompt = buildPerspectiveDescriptionPrompt({ baseline, style });
  return runPrompt(prompt);
}

export async function enhanceSceneSoulSuggestions(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<EnhanceResult> {
  const rows = await prisma.sceneSoulSuggestion.findMany({
    where: { metaSceneId },
    orderBy: { updatedAt: "desc" },
    take: 16,
  });
  if (!rows.length) return { ok: false, error: "No soul suggestions to enhance." };
  const prompt = buildSoulSuggestionPrompt({
    suggestions: rows.map((r) => ({ title: r.title, summary: r.summary, suggestionType: r.suggestionType })),
    style,
  });
  return runPrompt(prompt);
}

export async function enhanceFragmentInterpretation(fragmentId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<EnhanceResult> {
  const baseline = await describeFragmentRichly(fragmentId, style);
  const prompt = buildFragmentInterpretationPrompt({ baseline, style });
  return runPrompt(prompt);
}

export async function enhanceClusterSummary(clusterId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<EnhanceResult> {
  const baseline = await describeClusterRichly(clusterId, style);
  const prompt = buildClusterSummaryPrompt({ baseline, style });
  return runPrompt(prompt);
}

export async function enhanceRelationshipNarrative(relationshipId: string, style: NarrativeStylePreset = DEFAULT_SOURCE_GROUNDED_STYLE): Promise<EnhanceResult> {
  const r = await prisma.characterRelationship.findUnique({
    where: { id: relationshipId },
    include: { personA: { select: { name: true } }, personB: { select: { name: true } } },
  });
  if (!r) return { ok: false, error: "Relationship not found." };
  const baseline = [
    `Dyad: ${r.personA.name} ↔ ${r.personB.name}`,
    r.relationshipType ? `Type: ${r.relationshipType}` : null,
    r.relationshipSummary,
    r.emotionalPattern,
    r.conflictPattern,
    r.attachmentPattern,
    r.powerDynamic,
    r.enneagramDynamic,
    r.notes,
  ]
    .filter(Boolean)
    .join("\n\n");
  const prompt = buildRelationshipNarrativePrompt({ baseline, style });
  return runPrompt(prompt);
}
