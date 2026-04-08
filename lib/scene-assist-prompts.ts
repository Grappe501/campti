import type { WritingMode } from "@prisma/client";

type SceneAssistContextLite = {
  scene: {
    id: string;
    description: string;
    writingMode: WritingMode;
    historicalAnchor?: string | null;
    locationNote?: string | null;
    pov?: string | null;
    narrativeIntent?: string | null;
    emotionalTone?: string | null;
    continuitySummary?: string | null;
    sourceTraceSummary?: string | null;
    structuredDataJson?: unknown;
    draftText?: string | null;
  };
  chapter: {
    id: string;
    title: string;
    chapterNumber?: number | null;
    timePeriod?: string | null;
    pov?: string | null;
    historicalAnchor?: string | null;
  };
  linked: {
    people: Array<{ id: string; name: string; description?: string | null; birthYear?: number | null; deathYear?: number | null }>;
    places: Array<{ id: string; name: string; description?: string | null; placeType?: string | null }>;
    events: Array<{ id: string; title: string; description?: string | null; startYear?: number | null; endYear?: number | null; eventType?: string | null }>;
    symbols: Array<{ id: string; name: string; meaning?: string | null; category?: string | null }>;
    sources: Array<{ id: string; title: string; recordType?: string | null; sourceType?: string | null; sourceYear?: number | null; authorOrOrigin?: string | null }>;
    openQuestions: Array<{ id: string; title: string; description?: string | null; status?: string | null; priority?: number | null }>;
    continuityNotes: Array<{ id: string; title: string; description?: string | null; severity?: string | null; status?: string | null }>;
  };
  claims: Array<{ id: string; description: string; confidence?: number | null; needsReview?: boolean | null; source: { id: string; title: string } }>;
  provenance?: { sourceCount: number; claimCount: number; confidenceAvg: number | null };
  grounding?: { score: number; reasons: string[] };
};

function formatContextAsGroundedBlock(ctx: SceneAssistContextLite): string {
  // Keep this compact: it goes into every assist prompt.
  const claimsVerified = ctx.claims.filter((c) => !c.needsReview || (c.confidence ?? 0) >= 4);
  const claimsUnreviewed = ctx.claims.filter((c) => c.needsReview && (c.confidence ?? 0) <= 3);

  return [
    `SCENE`,
    `- id: ${ctx.scene.id}`,
    `- description: ${ctx.scene.description}`,
    `- writingMode: ${ctx.scene.writingMode}`,
    ctx.scene.historicalAnchor ? `- historicalAnchor: ${ctx.scene.historicalAnchor}` : null,
    ctx.scene.locationNote ? `- locationNote: ${ctx.scene.locationNote}` : null,
    ctx.scene.pov ? `- pov: ${ctx.scene.pov}` : null,
    ctx.scene.narrativeIntent ? `- narrativeIntent: ${ctx.scene.narrativeIntent}` : null,
    ctx.scene.emotionalTone ? `- emotionalTone: ${ctx.scene.emotionalTone}` : null,
    ctx.scene.sourceTraceSummary ? `- sourceTraceSummary: ${ctx.scene.sourceTraceSummary}` : null,
    ctx.scene.continuitySummary ? `- continuitySummary: ${ctx.scene.continuitySummary}` : null,
    ``,
    `CHAPTER`,
    `- id: ${ctx.chapter.id}`,
    `- title: ${ctx.chapter.title}`,
    ctx.chapter.chapterNumber != null ? `- chapterNumber: ${ctx.chapter.chapterNumber}` : null,
    ctx.chapter.timePeriod ? `- timePeriod: ${ctx.chapter.timePeriod}` : null,
    ctx.chapter.pov ? `- pov: ${ctx.chapter.pov}` : null,
    ctx.chapter.historicalAnchor ? `- historicalAnchor: ${ctx.chapter.historicalAnchor}` : null,
    ``,
    `LINKED ENTITIES (canonical records; do not invent beyond these)`,
    `- people: ${ctx.linked.people.map((p) => `${p.name} (${p.id})`).join("; ") || "none"}`,
    `- places: ${ctx.linked.places.map((p) => `${p.name} (${p.id})`).join("; ") || "none"}`,
    `- events: ${ctx.linked.events.map((e) => `${e.title} (${e.id})`).join("; ") || "none"}`,
    `- symbols: ${ctx.linked.symbols.map((s) => `${s.name} (${s.id})`).join("; ") || "none"}`,
    `- sources: ${ctx.linked.sources.map((s) => `${s.title} (${s.id})`).join("; ") || "none"}`,
    `- openQuestions: ${ctx.linked.openQuestions.map((q) => `${q.title} (${q.id})`).join("; ") || "none"}`,
    `- continuityNotes: ${ctx.linked.continuityNotes.map((n) => `${n.title} (${n.id})`).join("; ") || "none"}`,
    ``,
    `CLAIMS FROM LINKED SOURCES`,
    `- verifiedOrHighConfidence:`,
    ...claimsVerified.slice(0, 20).map((c) => `  - (${c.confidence ?? "?"}) ${c.description} [${c.source.title}]`),
    claimsVerified.length > 20 ? `  - … ${claimsVerified.length - 20} more` : null,
    `- unreviewedOrLowerConfidence (treat as tentative):`,
    ...claimsUnreviewed.slice(0, 20).map((c) => `  - (${c.confidence ?? "?"}) ${c.description} [${c.source.title}]`),
    claimsUnreviewed.length > 20 ? `  - … ${claimsUnreviewed.length - 20} more` : null,
    ``,
    `SCENE SCAFFOLD (structuredDataJson; may include risks/open questions):`,
    typeof ctx.scene.structuredDataJson !== "undefined"
      ? JSON.stringify(ctx.scene.structuredDataJson ?? {}, null, 2)
      : "{}",
    ``,
    `CURRENT DRAFT TEXT`,
    ctx.scene.draftText?.trim().length ? ctx.scene.draftText.trim() : "(empty)",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSceneAssistSystemPrompt(): string {
  return [
    `You are Campti's scene-writing assistant for historical/family narrative work.`,
    `Your job is to help the author write and revise a scene while staying grounded in provided context.`,
    ``,
    `Core rules (non-negotiable):`,
    `- Do NOT invent historical facts, names, dates, or relationships beyond the provided context.`,
    `- If the context is insufficient, say so and offer multiple plausible options as possibilities (not assertions).`,
    `- Distinguish VERIFIED / INFERRED / UNRESOLVED where possible.`,
    `- Preserve the author’s voice when continuing/expanding existing draft text.`,
    `- Never instruct the system to modify canonical records. Suggest links and checks only.`,
    `- Keep outputs practical, calm, and reviewable (no hype).`,
  ].join("\n");
}

export function buildStructuredSceneDraftPrompt(ctx: SceneAssistContextLite): string {
  const contextBlock = formatContextAsGroundedBlock(ctx);
  return [
    `Task: Draft a scene based ONLY on the context below.`,
    `Focus: grounded, historically cautious prose that reflects linked people/places/events/sources/claims.`,
    ``,
    `Output format: plain text scene draft only (no JSON).`,
    `- Keep it 700–1400 words unless the context is very small.`,
    `- When uncertain: write as subjective memory, rumor, or open question; do not state as fact.`,
    `- Work in anchors (place, time cues, who is present) early.`,
    ``,
    `Context:`,
    contextBlock,
  ].join("\n");
}

export function buildNarrativeExpansionPrompt(ctx: SceneAssistContextLite): string {
  const contextBlock = formatContextAsGroundedBlock(ctx);
  return [
    `Task: Expand the existing draft text without rewriting it from scratch.`,
    `- Preserve voice, tense, and viewpoint.`,
    `- Add grounded detail using the linked context and claims.`,
    `- Do NOT contradict existing draft unless you flag it as a possible issue.`,
    ``,
    `Output format: plain text expanded draft.`,
    `- Keep existing paragraphs; you may add new paragraphs in-between where natural.`,
    `- Do not include meta commentary.`,
    ``,
    `Context:`,
    contextBlock,
  ].join("\n");
}

export function buildContinuationPrompt(ctx: SceneAssistContextLite): string {
  const contextBlock = formatContextAsGroundedBlock(ctx);
  return [
    `Task: Continue the scene from the END of the current draft.`,
    `- Do not rewrite earlier parts.`,
    `- Continue in the same voice and cadence.`,
    `- Keep grounding visible: avoid introducing new factual claims not supported by context.`,
    ``,
    `Output format: plain text continuation ONLY (start where the draft ends).`,
    `Length: 300–800 words.`,
    ``,
    `Context:`,
    contextBlock,
  ].join("\n");
}

export function buildEntitySuggestionPrompt(ctx: SceneAssistContextLite): string {
  const contextBlock = formatContextAsGroundedBlock(ctx);
  return [
    `Task: Suggest likely entity links found in the CURRENT DRAFT TEXT.`,
    `- Identify mentions of people, places, events, symbols, and sources.`,
    `- If you can map a mention to a linked canonical record id, include it.`,
    `- If not, leave suggestedCanonicalIds empty and explain why.`,
    `- Be conservative: prefer fewer, higher-confidence suggestions.`,
    ``,
    `Output format: JSON ONLY, matching this shape exactly:`,
    `{`,
    `  "suggestions": [`,
    `    {`,
    `      "label": "string",`,
    `      "entityType": "person" | "place" | "event" | "symbol" | "source",`,
    `      "excerpt": "string",`,
    `      "suggestedCanonicalIds": ["string"],`,
    `      "confidence": 0.0,`,
    `      "reason": "string"`,
    `    }`,
    `  ],`,
    `  "ungroundedMentions": [`,
    `    { "label": "string", "entityType": "person" | "place" | "event" | "symbol" | "source", "excerpt": "string", "reason": "string" }`,
    `  ]`,
    `}`,
    ``,
    `Context:`,
    contextBlock,
  ].join("\n");
}

export function buildContinuityCheckPrompt(ctx: SceneAssistContextLite): string {
  const contextBlock = formatContextAsGroundedBlock(ctx);
  return [
    `Task: Run a conservative continuity check between the CURRENT DRAFT TEXT and the linked context.`,
    `Flag only "possible issues" and "things to verify".`,
    `Do not claim contradictions unless the context clearly supports it.`,
    ``,
    `Output format: JSON ONLY, matching this shape exactly:`,
    `{`,
    `  "summary": "string",`,
    `  "issues": [`,
    `    {`,
    `      "severity": "low" | "medium" | "high",`,
    `      "type": "timeline" | "identity" | "location" | "unsupported_fact" | "missing_anchor" | "unlinked_entity" | "other",`,
    `      "message": "string",`,
    `      "excerpt": "string",`,
    `      "suggestedFix": "string",`,
    `      "relatedEntityIds": ["string"]`,
    `    }`,
    `  ]`,
    `}`,
    ``,
    `Context:`,
    contextBlock,
  ].join("\n");
}

export function buildGroundingCheckPrompt(ctx: SceneAssistContextLite): string {
  const contextBlock = formatContextAsGroundedBlock(ctx);
  return [
    `Task: Check grounding of the CURRENT DRAFT TEXT against linked sources/claims and known scene context.`,
    `- Point out where the draft is well grounded, where it relies on inference, and where it drifts beyond records.`,
    `- Suggest which linked sources/claims could strengthen weak spots.`,
    `- Be explicit about uncertainty.`,
    ``,
    `Output format: JSON ONLY, matching this shape exactly:`,
    `{`,
    `  "summary": "string",`,
    `  "groundingScore": 0,`,
    `  "strengths": [ { "message": "string", "excerpt": "string" } ],`,
    `  "gaps": [ { "message": "string", "excerpt": "string", "suggestedSources": ["string"], "suggestedClaims": ["string"] } ]`,
    `}`,
    ``,
    `Context:`,
    contextBlock,
  ].join("\n");
}

