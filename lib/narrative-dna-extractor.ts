import {
  buildNarrativeDnaSystemPrompt,
  buildNarrativeDnaUserPrompt,
} from "@/lib/narrative-dna-prompt";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";
import { normalizeFullNarrativeDna, type FullNarrativeDnaPayload } from "@/lib/narrative-dna-validation";

export type DnaConfidenceFields = {
  confidence: number;
  uncertaintyNote?: string | null;
  layers?: string[] | null;
};

export type ExtractedNarrativeRule = DnaConfidenceFields & {
  title: string;
  description: string;
  category: string;
  strength?: number | null;
  scope?: string | null;
};

export type ExtractedTheme = DnaConfidenceFields & {
  name: string;
  description: string;
  intensity?: number | null;
  category?: string | null;
};

export type ExtractedSymbol = DnaConfidenceFields & {
  name: string;
  meaningPrimary: string;
  meaningSecondary?: string | null;
  emotionalTone?: string | null;
  usageContext?: string | null;
  certainty?: string | null;
  symbolCategory?: string | null;
};

export type ExtractedMotif = DnaConfidenceFields & {
  name: string;
  description: string;
  usagePattern?: string | null;
};

export type ExtractedLiteraryDevice = DnaConfidenceFields & {
  name: string;
  description: string;
  systemEffect: string;
};

export type ExtractedNarrativePattern = DnaConfidenceFields & {
  title: string;
  description: string;
  patternType: string;
  strength?: number | null;
};

export type FullNarrativeDnaResult = {
  rules: ExtractedNarrativeRule[];
  themes: ExtractedTheme[];
  symbols: ExtractedSymbol[];
  motifs: ExtractedMotif[];
  literaryDevices: ExtractedLiteraryDevice[];
  patterns: ExtractedNarrativePattern[];
  extractionMode: "openai" | "heuristic";
  warnings: string[];
};

function parseModelJson(content: string | null | undefined): unknown {
  if (!content?.trim()) throw new Error("Empty model content.");
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/u, "")
      .trim();
  }
  return JSON.parse(text) as unknown;
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function heuristicExtract(text: string): FullNarrativeDnaResult {
  const warnings = [
    "Heuristic extraction only (no OpenAI). Review all rows; confidence scores are estimated.",
  ];
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
  const rules: ExtractedNarrativeRule[] = [];
  const themes: ExtractedTheme[] = [];
  const symbols: ExtractedSymbol[] = [];
  const motifs: ExtractedMotif[] = [];
  const literaryDevices: ExtractedLiteraryDevice[] = [];
  const patterns: ExtractedNarrativePattern[] = [];

  const pushUniqueTheme = (name: string, description: string, layers: string[]) => {
    if (themes.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    themes.push({
      name,
      description,
      intensity: null,
      category: null,
      confidence: 0.35,
      uncertaintyNote: "Heuristic theme guess from phrasing — verify against document.",
      layers,
    });
  };

  for (const p of paragraphs.slice(0, 80)) {
    const lower = p.toLowerCase();
    if (/theme|motif|symbol|metaphor|foreshadow|lineage|memory|oral tradition/.test(lower)) {
      const title = p.slice(0, 72).replace(/\s+/g, " ").trim();
      if (/theme/.test(lower)) {
        pushUniqueTheme(title, p.slice(0, 2000), ["theme", "narrative_structure"]);
      }
      if (/motif/.test(lower)) {
        motifs.push({
          name: title,
          description: p.slice(0, 2000),
          usagePattern: null,
          confidence: 0.3,
          uncertaintyNote: "Keyword-triggered motif candidate.",
          layers: ["motif", "narrative_structure"],
        });
      }
      if (/symbol|metaphor/.test(lower)) {
        symbols.push({
          name: title.slice(0, 120),
          meaningPrimary: p.slice(0, 1500),
          meaningSecondary: null,
          emotionalTone: null,
          usageContext: null,
          certainty: "interpretive",
          symbolCategory: null,
          confidence: 0.3,
          uncertaintyNote: "Keyword-triggered symbol candidate — meaning is interpretive.",
          layers: ["symbol", "emotional_pattern"],
        });
      }
      if (/foreshadow|irony|repetition|fragment|nonlinear|parallel|juxtaposition/.test(lower)) {
        literaryDevices.push({
          name: title.slice(0, 120),
          description: p.slice(0, 1500),
          systemEffect: "Affects pacing, revelation, or reader inference — refine manually.",
          confidence: 0.28,
          uncertaintyNote: "Device inferred from vocabulary, not full rhetorical analysis.",
          layers: ["literary_device", "narration"],
        });
      }
      if (/generation|inherit|mother|father|family pattern|identity|shame|duty/.test(lower)) {
        patterns.push({
          title: title.slice(0, 120),
          description: p.slice(0, 2000),
          patternType: /generation|inherit|father|mother/.test(lower) ? "generational" : "emotional",
          strength: null,
          confidence: 0.32,
          uncertaintyNote: "Pattern suggested by family/identity language.",
          layers: ["pattern", "lineage", "relationship"],
        });
      }
    }

    if (p.length > 120 && rules.length < 40) {
      const wc = tokenizeWords(p).length;
      if (wc > 25 && /must|should|never|always|rule|constraint|law of/.test(lower)) {
        rules.push({
          title: p.split(/[.:\n]/)[0]?.slice(0, 120) || "Narrative constraint",
          description: p.slice(0, 2000),
          category: /character|pov|voice/.test(lower) ? "character" : "structure",
          strength: 3,
          scope: "scene",
          confidence: 0.25,
          uncertaintyNote: "Heuristic rule from prescriptive language — may be advice, not canon.",
          layers: ["rule", "narration"],
        });
      }
    }
  }

  if (
    rules.length === 0 &&
    themes.length === 0 &&
    symbols.length === 0 &&
    motifs.length === 0 &&
    literaryDevices.length === 0 &&
    patterns.length === 0
  ) {
    warnings.push("No strong keyword hits; emitted one low-confidence structural rule from the opening.");
    rules.push({
      title: "Document body (unclassified)",
      description: text.slice(0, 3000),
      category: "structure",
      strength: 1,
      scope: "global",
      confidence: 0.15,
      uncertaintyNote: "Fallback bucket — classify manually.",
      layers: ["rule", "narrative_structure"],
    });
  }

  return {
    rules,
    themes,
    symbols,
    motifs,
    literaryDevices,
    patterns,
    extractionMode: "heuristic",
    warnings,
  };
}

async function openAiExtract(text: string): Promise<FullNarrativeDnaResult | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      { role: "system", content: buildNarrativeDnaSystemPrompt() },
      { role: "user", content: buildNarrativeDnaUserPrompt(text) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.25,
  });
  const content = completion.choices[0]?.message?.content;
  const raw = parseModelJson(content) as FullNarrativeDnaPayload;
  const normalized = normalizeFullNarrativeDna(raw);
  const total =
    normalized.rules.length +
    normalized.themes.length +
    normalized.symbols.length +
    normalized.motifs.length +
    normalized.literaryDevices.length +
    normalized.patterns.length;
  if (total === 0) return null;
  return {
    rules: normalized.rules,
    themes: normalized.themes,
    symbols: normalized.symbols,
    motifs: normalized.motifs,
    literaryDevices: normalized.literaryDevices,
    patterns: normalized.patterns,
    extractionMode: "openai",
    warnings: normalized.warnings,
  };
}

export type ExtractDnaOptions = {
  /** When true (default), use OpenAI when configured. */
  useOpenAI?: boolean;
};

/**
 * Full pipeline: prefers OpenAI when API key exists and useOpenAI is true; otherwise heuristic fallback.
 */
export async function extractFullNarrativeDna(
  text: string,
  options?: ExtractDnaOptions,
): Promise<FullNarrativeDnaResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      rules: [],
      themes: [],
      symbols: [],
      motifs: [],
      literaryDevices: [],
      patterns: [],
      extractionMode: "heuristic",
      warnings: ["Empty text — nothing extracted."],
    };
  }

  const useOpenAI = options?.useOpenAI !== false;
  if (useOpenAI) {
    try {
      const ai = await openAiExtract(trimmed);
      if (ai) return ai;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OpenAI extraction failed.";
      const fallback = heuristicExtract(trimmed);
      fallback.warnings.unshift(`OpenAI failed (${msg}); used heuristic fallback.`);
      return fallback;
    }
  }

  return heuristicExtract(trimmed);
}

/** Each function runs the full extractor once; prefer `extractFullNarrativeDna` if you need multiple slices. */
export async function extractNarrativeRules(text: string, opts?: ExtractDnaOptions) {
  const r = await extractFullNarrativeDna(text, opts);
  return r.rules;
}

export async function extractThemes(text: string, opts?: ExtractDnaOptions) {
  const r = await extractFullNarrativeDna(text, opts);
  return r.themes;
}

export async function extractSymbols(text: string, opts?: ExtractDnaOptions) {
  const r = await extractFullNarrativeDna(text, opts);
  return r.symbols;
}

export async function extractMotifs(text: string, opts?: ExtractDnaOptions) {
  const r = await extractFullNarrativeDna(text, opts);
  return r.motifs;
}

export async function extractLiteraryDevices(text: string, opts?: ExtractDnaOptions) {
  const r = await extractFullNarrativeDna(text, opts);
  return r.literaryDevices;
}

export async function extractNarrativePatterns(text: string, opts?: ExtractDnaOptions) {
  const r = await extractFullNarrativeDna(text, opts);
  return r.patterns;
}
