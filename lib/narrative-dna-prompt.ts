/**
 * Prompts for narrative DNA extraction. Model output is advisory; ambiguity must be preserved.
 */

export function buildNarrativeDnaSystemPrompt(): string {
  return `You are a narrative analyst for a private authoring system. Decompose the supplied document into structured narrative intelligence.

Rules:
- Preserve uncertainty: use uncertaintyNote when interpretation is debatable, emotional, or under-supported by the text.
- confidence is a number from 0 to 1 (not percentages).
- layers is an array of strings tagging each item with one or more of: theme, symbol, rule, emotional_pattern, narrative_structure, motif, literary_device, pattern, memory, lineage, relationship, narration.
- Do not invent facts not grounded in the text; prefer lower confidence and a note instead.
- categories must use the allowed values given in the user message.
- Return ONLY valid JSON matching the schema described in the user message. No markdown fences.`;
}

export function buildNarrativeDnaUserPrompt(documentBody: string): string {
  const body =
    documentBody.length > 120_000
      ? `${documentBody.slice(0, 120_000)}\n\n[TRUNCATED_FOR_MODEL]`
      : documentBody;

  return `Extract narrative DNA from the following document.

Allowed rule.category values: structure, character, memory, symbolism, relationship, narration
Allowed theme.category values: core, subtheme (or null)
Allowed pattern.patternType values: generational, emotional, relational, identity

JSON shape:
{
  "rules": [{
    "title": string,
    "description": string,
    "category": string,
    "strength": number | null (1-5),
    "scope": string | null,
    "confidence": number,
    "uncertaintyNote": string | null,
    "layers": string[]
  }],
  "themes": [{
    "name": string,
    "description": string,
    "intensity": number | null (1-5),
    "category": string | null,
    "confidence": number,
    "uncertaintyNote": string | null,
    "layers": string[]
  }],
  "symbols": [{
    "name": string,
    "meaningPrimary": string,
    "meaningSecondary": string | null,
    "emotionalTone": string | null,
    "usageContext": string | null,
    "certainty": string | null,
    "symbolCategory": string | null (element, food, plant, religious, family_sym, ritual, symbol_other — or null),
    "confidence": number,
    "uncertaintyNote": string | null,
    "layers": string[]
  }],
  "motifs": [{
    "name": string,
    "description": string,
    "usagePattern": string | null,
    "confidence": number,
    "uncertaintyNote": string | null,
    "layers": string[]
  }],
  "literaryDevices": [{
    "name": string,
    "description": string,
    "systemEffect": string,
    "confidence": number,
    "uncertaintyNote": string | null,
    "layers": string[]
  }],
  "patterns": [{
    "title": string,
    "description": string,
    "patternType": string,
    "strength": number | null,
    "confidence": number,
    "uncertaintyNote": string | null,
    "layers": string[]
  }]
}

Document:
---
${body}
---
`;
}
