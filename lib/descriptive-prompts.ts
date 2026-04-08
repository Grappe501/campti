import type { NarrativeStylePreset } from "@/lib/descriptive-validation";
import { NARRATIVE_STYLE_PRESETS } from "@/lib/narrative-style";

const SAFETY = [
  "Use ONLY the structured context provided below.",
  "Do not invent historical facts, dates, names, or events not present in the context.",
  "Preserve uncertainty where the context is thin; label inference as inference.",
  "Do not collapse hypothesis into fact.",
  "Output literary but controlled prose — no purple prose, no filler.",
].join("\n");

export function buildWorldStateDescriptionPrompt(context: {
  baseline: string;
  style: NarrativeStylePreset;
}): string {
  const g = NARRATIVE_STYLE_PRESETS[context.style]?.guidance ?? "";
  return `${SAFETY}

Style: ${context.style} — ${g}

Task: Rewrite the following world-state baseline into a richer, more immersive paragraph block (or short sections). Stay faithful to the facts given.

--- CONTEXT ---
${context.baseline}`;
}

export function buildPerspectiveDescriptionPrompt(context: {
  baseline: string;
  style: NarrativeStylePreset;
}): string {
  const g = NARRATIVE_STYLE_PRESETS[context.style]?.guidance ?? "";
  return `${SAFETY}

Style: ${context.style} — ${g}

Task: Deepen the POV perspective summary below — attention, body, memory pressure, unspoken needs — without inventing biography.

--- CONTEXT ---
${context.baseline}`;
}

export function buildSoulSuggestionPrompt(context: {
  suggestions: { title: string; summary: string; suggestionType: string }[];
  style: NarrativeStylePreset;
}): string {
  const g = NARRATIVE_STYLE_PRESETS[context.style]?.guidance ?? "";
  const blob = context.suggestions.map((s) => `- [${s.suggestionType}] ${s.title}: ${s.summary}`).join("\n");
  return `${SAFETY}

Style: ${context.style} — ${g}

Task: For each suggestion, optionally add one short editorial sentence that explains *why* it matters to craft — do not replace the author's summary; extend it.

--- SUGGESTIONS ---
${blob}`;
}

export function buildFragmentInterpretationPrompt(context: {
  baseline: string;
  style: NarrativeStylePreset;
}): string {
  const g = NARRATIVE_STYLE_PRESETS[context.style]?.guidance ?? "";
  return `${SAFETY}

Style: ${context.style} — ${g}

Task: Produce a single cohesive interpretation paragraph from the fragment fields below (surface, underneath, uses). Do not quote sources not in context.

--- CONTEXT ---
${context.baseline}`;
}

export function buildRelationshipNarrativePrompt(context: {
  baseline: string;
  style: NarrativeStylePreset;
}): string {
  const g = NARRATIVE_STYLE_PRESETS[context.style]?.guidance ?? "";
  return `${SAFETY}

Style: ${context.style} — ${g}

Task: Synthesize dyad dynamics into readable prose — attraction/tension, misread loops, repair — using only authored fields.

--- CONTEXT ---
${context.baseline}`;
}

export function buildClusterSummaryPrompt(context: {
  baseline: string;
  style: NarrativeStylePreset;
}): string {
  const g = NARRATIVE_STYLE_PRESETS[context.style]?.guidance ?? "";
  return `${SAFETY}

Style: ${context.style} — ${g}

Task: Describe what unifies this fragment cluster and what narrative current it forms.

--- CONTEXT ---
${context.baseline}`;
}
