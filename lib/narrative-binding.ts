import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  bindingDuplicateWhere,
  validateNarrativeBindingInput,
  type NarrativeBindingInput,
} from "@/lib/narrative-dna-validation";

export async function createBindingIfFreshTx(
  tx: Prisma.TransactionClient,
  input: NarrativeBindingInput,
) {
  const v = validateNarrativeBindingInput(input);
  if (!v.ok) throw new Error(v.error);
  const where = bindingDuplicateWhere(input);
  const existing = await tx.narrativeBinding.findFirst({ where });
  if (existing) return existing;
  return tx.narrativeBinding.create({
    data: {
      sourceType: input.sourceType.trim(),
      sourceId: input.sourceId.trim(),
      targetType: input.targetType.trim(),
      targetId: input.targetId.trim(),
      relationship: input.relationship,
      strength: input.strength ?? undefined,
      notes: input.notes?.trim() || undefined,
    },
  });
}

export const NARRATIVE_BINDING_TYPES = [
  "narrative_rule",
  "theme",
  "symbol",
  "motif",
  "literary_device",
  "narrative_pattern",
  "fragment",
  "scene",
  "meta_scene",
  "person",
  "place",
  "source",
] as const;

export type NarrativeEntityType = (typeof NARRATIVE_BINDING_TYPES)[number];

export async function createBindingIfFresh(input: NarrativeBindingInput) {
  const v = validateNarrativeBindingInput(input);
  if (!v.ok) throw new Error(v.error);
  const where = bindingDuplicateWhere(input);
  const existing = await prisma.narrativeBinding.findFirst({ where });
  if (existing) return existing;
  return prisma.narrativeBinding.create({
    data: {
      sourceType: input.sourceType.trim(),
      sourceId: input.sourceId.trim(),
      targetType: input.targetType.trim(),
      targetId: input.targetId.trim(),
      relationship: input.relationship,
      strength: input.strength ?? undefined,
      notes: input.notes?.trim() || undefined,
    },
  });
}

export async function linkRuleToTheme(ruleId: string, themeId: string, opts?: { strength?: number; notes?: string }) {
  return createBindingIfFresh({
    sourceType: "narrative_rule",
    sourceId: ruleId,
    targetType: "theme",
    targetId: themeId,
    relationship: "expresses",
    strength: opts?.strength,
    notes: opts?.notes,
  });
}

export async function linkSymbolToTheme(symbolId: string, themeId: string, opts?: { strength?: number; notes?: string }) {
  return createBindingIfFresh({
    sourceType: "symbol",
    sourceId: symbolId,
    targetType: "theme",
    targetId: themeId,
    relationship: "expresses",
    strength: opts?.strength,
    notes: opts?.notes,
  });
}

export async function linkPatternToCharacter(patternId: string, personId: string, opts?: { strength?: number; notes?: string }) {
  return createBindingIfFresh({
    sourceType: "narrative_pattern",
    sourceId: patternId,
    targetType: "person",
    targetId: personId,
    relationship: "influences",
    strength: opts?.strength,
    notes: opts?.notes,
  });
}

export async function linkThemeToScene(themeId: string, sceneId: string, opts?: { strength?: number; notes?: string }) {
  return createBindingIfFresh({
    sourceType: "theme",
    sourceId: themeId,
    targetType: "scene",
    targetId: sceneId,
    relationship: "influences",
    strength: opts?.strength,
    notes: opts?.notes,
  });
}

export async function linkSymbolToFragment(symbolId: string, fragmentId: string, opts?: { strength?: number; notes?: string }) {
  return createBindingIfFresh({
    sourceType: "symbol",
    sourceId: symbolId,
    targetType: "fragment",
    targetId: fragmentId,
    relationship: "expresses",
    strength: opts?.strength,
    notes: opts?.notes,
  });
}

export type BindingSuggestion = {
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  relationship: string;
  rationale: string;
  strength?: number;
};

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) {
    if (b.has(w)) n++;
  }
  return n;
}

/**
 * Lightweight token overlap between a narrative row and candidate targets (name/title + description).
 */
export async function autoSuggestBindings(entity: {
  type: NarrativeEntityType;
  id: string;
  label: string;
  textBlob: string;
}): Promise<BindingSuggestion[]> {
  const tokens = tokenize(`${entity.label} ${entity.textBlob}`);
  if (tokens.size === 0) return [];

  const suggestions: BindingSuggestion[] = [];

  const [people, places, themes, symbols, fragments] = await Promise.all([
    prisma.person.findMany({
      select: { id: true, name: true, description: true },
      take: 80,
    }),
    prisma.place.findMany({
      select: { id: true, name: true },
      take: 80,
    }),
    prisma.theme.findMany({
      select: { id: true, name: true, description: true },
      take: 80,
    }),
    prisma.symbol.findMany({
      select: { id: true, name: true, meaning: true, meaningPrimary: true },
      take: 80,
    }),
    prisma.fragment.findMany({
      select: { id: true, title: true, text: true },
      take: 60,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const consider = (
    targetType: string,
    targetId: string,
    targetLabel: string,
    blob: string,
    relationship: string,
  ) => {
    const t2 = tokenize(blob);
    const score = overlapScore(tokens, t2);
    if (score >= 2) {
      suggestions.push({
        sourceType: entity.type,
        sourceId: entity.id,
        sourceLabel: entity.label,
        targetType,
        targetId,
        targetLabel,
        relationship,
        rationale: `Shared token overlap (~${score} stems). Verify before linking.`,
        strength: Math.min(5, 2 + Math.min(3, Math.floor(score / 3))),
      });
    }
  };

  if (entity.type !== "person") {
    for (const p of people) {
      consider("person", p.id, p.name, `${p.name} ${p.description ?? ""}`, "influences");
    }
  }
  if (entity.type !== "place") {
    for (const pl of places) {
      consider("place", pl.id, pl.name, pl.name, "influences");
    }
  }
  for (const th of themes) {
    if (entity.type === "theme" && th.id === entity.id) continue;
    consider("theme", th.id, th.name, `${th.name} ${th.description}`, "expresses");
  }
  for (const s of symbols) {
    if (entity.type === "symbol" && s.id === entity.id) continue;
    consider(
      "symbol",
      s.id,
      s.name,
      `${s.name} ${s.meaning ?? ""} ${s.meaningPrimary ?? ""}`,
      "expresses",
    );
  }
  if (entity.type !== "fragment") {
    for (const f of fragments) {
      consider(
        "fragment",
        f.id,
        f.title?.trim() || f.text.slice(0, 48),
        `${f.title ?? ""} ${f.text}`,
        "emerges_from",
      );
    }
  }

  suggestions.sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));
  return suggestions.slice(0, 24);
}

export type InferredBinding = Omit<BindingSuggestion, "sourceLabel"> & { confidence: number };

export async function inferBindingsFromText(text: string): Promise<InferredBinding[]> {
  const tokens = tokenize(text);
  if (tokens.size < 4) return [];

  const [themes, symbols, rules] = await Promise.all([
    prisma.theme.findMany({ take: 100 }),
    prisma.symbol.findMany({ take: 100 }),
    prisma.narrativeRule.findMany({ take: 100 }),
  ]);

  const out: InferredBinding[] = [];

  for (const th of themes) {
    const score = overlapScore(tokens, tokenize(`${th.name} ${th.description}`));
    if (score >= 2) {
      out.push({
        sourceType: "theme",
        sourceId: th.id,
        targetType: "inferred_text",
        targetId: "pending",
        targetLabel: "(attach to scene, fragment, or character manually)",
        relationship: "influences",
        rationale: `Theme "${th.name}" overlaps extracted passage tokens.`,
        strength: Math.min(5, 2 + Math.floor(score / 4)),
        confidence: Math.min(0.85, 0.25 + score * 0.06),
      });
    }
  }
  for (const s of symbols) {
    const score = overlapScore(
      tokens,
      tokenize(`${s.name} ${s.meaning ?? ""} ${s.meaningPrimary ?? ""}`),
    );
    if (score >= 2) {
      out.push({
        sourceType: "symbol",
        sourceId: s.id,
        targetType: "inferred_text",
        targetId: "pending",
        targetLabel: "(attach manually)",
        relationship: "expresses",
        rationale: `Symbol "${s.name}" overlaps passage.`,
        strength: Math.min(5, 2 + Math.floor(score / 4)),
        confidence: Math.min(0.8, 0.22 + score * 0.06),
      });
    }
  }
  for (const r of rules) {
    const score = overlapScore(tokens, tokenize(`${r.title} ${r.description}`));
    if (score >= 2) {
      out.push({
        sourceType: "narrative_rule",
        sourceId: r.id,
        targetType: "inferred_text",
        targetId: "pending",
        targetLabel: "(attach manually)",
        relationship: "influences",
        rationale: `Rule "${r.title}" overlaps passage.`,
        strength: Math.min(5, 2 + Math.floor(score / 4)),
        confidence: Math.min(0.75, 0.2 + score * 0.05),
      });
    }
  }

  return out.slice(0, 40);
}

export async function inferBindingsFromFragments(fragmentId: string): Promise<InferredBinding[]> {
  const f = await prisma.fragment.findUnique({
    where: { id: fragmentId },
    select: { text: true, title: true, summary: true },
  });
  if (!f) return [];
  const blob = `${f.title ?? ""} ${f.summary ?? ""} ${f.text}`;
  return inferBindingsFromText(blob);
}

export async function wipeNarrativeDnaRowsForSource(
  tx: Prisma.TransactionClient,
  sourceId: string,
): Promise<void> {
  const [rules, themes, motifs, devices, patterns, symbols] = await Promise.all([
    tx.narrativeRule.findMany({ where: { sourceId }, select: { id: true } }),
    tx.theme.findMany({ where: { sourceId }, select: { id: true } }),
    tx.motif.findMany({ where: { sourceId }, select: { id: true } }),
    tx.literaryDevice.findMany({ where: { sourceId }, select: { id: true } }),
    tx.narrativePattern.findMany({ where: { sourceId }, select: { id: true } }),
    tx.symbol.findMany({ where: { sourceId }, select: { id: true } }),
  ]);

  const refs: { t: string; id: string }[] = [
    ...rules.map((r) => ({ t: "narrative_rule", id: r.id })),
    ...themes.map((r) => ({ t: "theme", id: r.id })),
    ...motifs.map((r) => ({ t: "motif", id: r.id })),
    ...devices.map((r) => ({ t: "literary_device", id: r.id })),
    ...patterns.map((r) => ({ t: "narrative_pattern", id: r.id })),
    ...symbols.map((r) => ({ t: "symbol", id: r.id })),
  ];

  for (const { t, id } of refs) {
    await tx.narrativeBinding.deleteMany({
      where: {
        OR: [
          { sourceType: t, sourceId: id },
          { targetType: t, targetId: id },
        ],
      },
    });
  }

  await tx.narrativeRule.deleteMany({ where: { sourceId } });
  await tx.theme.deleteMany({ where: { sourceId } });
  await tx.motif.deleteMany({ where: { sourceId } });
  await tx.literaryDevice.deleteMany({ where: { sourceId } });
  await tx.narrativePattern.deleteMany({ where: { sourceId } });
  await tx.symbol.deleteMany({ where: { sourceId } });
}
