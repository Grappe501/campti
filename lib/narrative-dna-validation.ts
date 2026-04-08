import type {
  ExtractedLiteraryDevice,
  ExtractedMotif,
  ExtractedNarrativePattern,
  ExtractedNarrativeRule,
  ExtractedSymbol,
  ExtractedTheme,
} from "@/lib/narrative-dna-extractor";

export type FullNarrativeDnaPayload = {
  rules?: unknown;
  themes?: unknown;
  symbols?: unknown;
  motifs?: unknown;
  literaryDevices?: unknown;
  patterns?: unknown;
};

function clampConfidence(n: unknown): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function numOrNull(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function layers(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x) => typeof x === "string" && x.trim()).map((x) => String(x).trim());
  return out.length ? out : undefined;
}

function normalizeRule(o: unknown): ExtractedNarrativeRule | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const title = str(r.title).trim();
  const description = str(r.description).trim();
  if (!title || !description) return null;
  return {
    title: title.slice(0, 500),
    description: description.slice(0, 50_000),
    category: str(r.category, "structure").slice(0, 120),
    strength: numOrNull(r.strength, 1, 5),
    scope: strOrNull(r.scope),
    confidence: clampConfidence(r.confidence),
    uncertaintyNote: strOrNull(r.uncertaintyNote),
    layers: layers(r.layers),
  };
}

function normalizeTheme(o: unknown): ExtractedTheme | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const name = str(r.name).trim();
  const description = str(r.description).trim();
  if (!name || !description) return null;
  return {
    name: name.slice(0, 500),
    description: description.slice(0, 50_000),
    intensity: numOrNull(r.intensity, 1, 5),
    category: strOrNull(r.category),
    confidence: clampConfidence(r.confidence),
    uncertaintyNote: strOrNull(r.uncertaintyNote),
    layers: layers(r.layers),
  };
}

function normalizeSymbol(o: unknown): ExtractedSymbol | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const name = str(r.name).trim();
  const meaningPrimary = str(r.meaningPrimary).trim();
  if (!name || !meaningPrimary) return null;
  return {
    name: name.slice(0, 500),
    meaningPrimary: meaningPrimary.slice(0, 20_000),
    meaningSecondary: strOrNull(r.meaningSecondary),
    emotionalTone: strOrNull(r.emotionalTone),
    usageContext: strOrNull(r.usageContext),
    certainty: strOrNull(r.certainty),
    symbolCategory: strOrNull(r.symbolCategory),
    confidence: clampConfidence(r.confidence),
    uncertaintyNote: strOrNull(r.uncertaintyNote),
    layers: layers(r.layers),
  };
}

function normalizeMotif(o: unknown): ExtractedMotif | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const name = str(r.name).trim();
  const description = str(r.description).trim();
  if (!name || !description) return null;
  return {
    name: name.slice(0, 500),
    description: description.slice(0, 50_000),
    usagePattern: strOrNull(r.usagePattern),
    confidence: clampConfidence(r.confidence),
    uncertaintyNote: strOrNull(r.uncertaintyNote),
    layers: layers(r.layers),
  };
}

function normalizeDevice(o: unknown): ExtractedLiteraryDevice | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const name = str(r.name).trim();
  const description = str(r.description).trim();
  const systemEffect = str(r.systemEffect).trim();
  if (!name || !description || !systemEffect) return null;
  return {
    name: name.slice(0, 500),
    description: description.slice(0, 50_000),
    systemEffect: systemEffect.slice(0, 20_000),
    confidence: clampConfidence(r.confidence),
    uncertaintyNote: strOrNull(r.uncertaintyNote),
    layers: layers(r.layers),
  };
}

function normalizePattern(o: unknown): ExtractedNarrativePattern | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const title = str(r.title).trim();
  const description = str(r.description).trim();
  const patternType = str(r.patternType, "emotional").slice(0, 120);
  if (!title || !description) return null;
  return {
    title: title.slice(0, 500),
    description: description.slice(0, 50_000),
    patternType,
    strength: numOrNull(r.strength, 1, 5),
    confidence: clampConfidence(r.confidence),
    uncertaintyNote: strOrNull(r.uncertaintyNote),
    layers: layers(r.layers),
  };
}

function arr<T>(v: unknown, norm: (x: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    const n = norm(item);
    if (n) out.push(n);
  }
  return out;
}

export function normalizeFullNarrativeDna(raw: FullNarrativeDnaPayload): {
  rules: ExtractedNarrativeRule[];
  themes: ExtractedTheme[];
  symbols: ExtractedSymbol[];
  motifs: ExtractedMotif[];
  literaryDevices: ExtractedLiteraryDevice[];
  patterns: ExtractedNarrativePattern[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const rules = arr(raw.rules, normalizeRule);
  const themes = arr(raw.themes, normalizeTheme);
  const symbols = arr(raw.symbols, normalizeSymbol);
  const motifs = arr(raw.motifs, normalizeMotif);
  const literaryDevices = arr(raw.literaryDevices, normalizeDevice);
  const patterns = arr(raw.patterns, normalizePattern);
  if (
    rules.length + themes.length + symbols.length + motifs.length + literaryDevices.length + patterns.length ===
    0
  ) {
    warnings.push("Model JSON parsed but no valid narrative objects after normalization.");
  }
  return { rules, themes, symbols, motifs, literaryDevices, patterns, warnings };
}

export type NarrativeBindingInput = {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship: string;
  strength?: number | null;
  notes?: string | null;
};

const BINDING_RELATIONSHIPS = new Set([
  "influences",
  "expresses",
  "contradicts",
  "emerges_from",
]);

export function validateNarrativeBindingInput(
  input: NarrativeBindingInput,
): { ok: true } | { ok: false; error: string } {
  if (!input.sourceType?.trim() || !input.sourceId?.trim()) {
    return { ok: false, error: "sourceType and sourceId required." };
  }
  if (!input.targetType?.trim() || !input.targetId?.trim()) {
    return { ok: false, error: "targetType and targetId required." };
  }
  if (!BINDING_RELATIONSHIPS.has(input.relationship)) {
    return { ok: false, error: `relationship must be one of: ${[...BINDING_RELATIONSHIPS].join(", ")}` };
  }
  if (input.strength != null && (input.strength < 1 || input.strength > 5)) {
    return { ok: false, error: "strength must be 1–5 or null." };
  }
  return { ok: true };
}

export function bindingDuplicateWhere(input: NarrativeBindingInput): {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship: string;
} {
  return {
    sourceType: input.sourceType.trim(),
    sourceId: input.sourceId.trim(),
    targetType: input.targetType.trim(),
    targetId: input.targetId.trim(),
    relationship: input.relationship,
  };
}
