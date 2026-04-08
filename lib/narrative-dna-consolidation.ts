import type { Prisma } from "@prisma/client";
import { createBindingIfFresh } from "@/lib/narrative-binding";
import { prisma } from "@/lib/prisma";
import { bindingDuplicateWhere, type NarrativeBindingInput } from "@/lib/narrative-dna-validation";

/** --- Normalization --- */

export function normalizeSymbolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeThemeName(name: string): string {
  return normalizeSymbolName(name);
}

export function normalizeRuleTitle(title: string): string {
  return normalizeSymbolName(title);
}

function tokenSet(text: string): Set<string> {
  const words = normalizeSymbolName(text)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/** Jaccard-like similarity on word tokens (0–1). */
export function scoreNarrativeDnaSimilarity(
  a: { label: string; body: string },
  b: { label: string; body: string },
): number {
  const A = tokenSet(`${a.label} ${a.body}`);
  const B = tokenSet(`${b.label} ${b.body}`);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) {
    if (B.has(w)) inter++;
  }
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

/** --- Source support --- */

export async function attachAdditionalSourceSupport(
  canonicalId: string,
  dnaEntityType: string,
  sourceId: string,
  notes?: string,
): Promise<void> {
  await createBindingIfFresh({
    sourceType: dnaEntityType,
    sourceId: canonicalId,
    targetType: "source",
    targetId: sourceId,
    relationship: "emerges_from",
    strength: 3,
    notes: notes?.trim() || "Additional guide source support (consolidation).",
  });
}

type SymbolGroup = { canonicalName: string; variants: string[] };
type ThemeGroup = { canonicalName: string; variants: string[] };
type RuleDevGroup = { canonicalName: string; variants: string[] };

/**
 * Duplicate resolution policy (Phase 9F.1). Variants are normalized keys (lowercase phrases).
 */
export const SYMBOL_MERGE_POLICY: SymbolGroup[] = [
  { canonicalName: "Sassafras", variants: ["sassafras"] },
  { canonicalName: "Roux", variants: ["roux"] },
  { canonicalName: "Okra", variants: ["okra"] },
  { canonicalName: "Fire and flame", variants: ["fire", "flame", "fire and flame"] },
  { canonicalName: "Smoke", variants: ["smoke"] },
  {
    canonicalName: "Graveyard line",
    variants: ["graveyard line", "graveyard fence", "the line", "graveyard boundary"],
  },
  {
    canonicalName: "Chapel",
    variants: ["chapel", "campti chapel", "our blessed mother church", "blessed mother church"],
  },
  { canonicalName: "Garden", variants: ["garden"] },
  { canonicalName: "Billy club", variants: ["billy club", "billyclub"] },
  { canonicalName: "Oak", variants: ["oak", "split oak", "split oak tree"] },
  { canonicalName: "Bees", variants: ["bees", "bee"] },
  { canonicalName: "Reserved pew", variants: ["reserved pew"] },
  { canonicalName: "Choir loft", variants: ["choir loft", "choir"] },
];

export const THEME_MERGE_POLICY: ThemeGroup[] = [
  { canonicalName: "Identity and belonging", variants: ["identity and belonging", "identity belonging"] },
  { canonicalName: "Identity and assimilation", variants: ["identity and assimilation", "assimilation"] },
  { canonicalName: "Legacy and lineage", variants: ["legacy and lineage", "legacy lineage"] },
  {
    canonicalName: "Memory and reconstruction",
    variants: ["memory and reconstruction", "generational memory", "memory reconstruction"],
  },
  {
    canonicalName: "Matriarchal power",
    variants: ["matriarchal power", "family structure and gender roles", "gender roles family"],
  },
  {
    canonicalName: "Faith and the sacred",
    variants: ["faith and the sacred", "faith and duality", "spiritual dissonance", "faith duality"],
  },
  {
    canonicalName: "Land and belonging",
    variants: ["land and belonging", "land and the dead", "land dead"],
  },
  {
    canonicalName: "Death, burial, and rebirth",
    variants: ["death burial and rebirth", "death burial rebirth", "burial and rebirth"],
  },
  {
    canonicalName: "Silence and emotional containment",
    variants: ["silence and emotional containment", "masculine vulnerability", "silence containment"],
  },
  { canonicalName: "Migration and displacement", variants: ["migration and displacement", "migration displacement"] },
  {
    canonicalName: "Bloodlines and boundaries",
    variants: ["bloodlines and boundaries", "racial and social borders", "social borders"],
  },
];

export const RULE_DEVICE_MERGE_POLICY: RuleDevGroup[] = [
  { canonicalName: "Nonlinear narrative", variants: ["nonlinear narrative", "non linear narrative"] },
  {
    canonicalName: "Unreliable narrator (intentional)",
    variants: ["unreliable narrator", "unreliable narrator intentional"],
  },
  { canonicalName: "Embedded oral history", variants: ["embedded oral history", "oral history embedded"] },
  { canonicalName: "Mirroring", variants: ["mirroring", "mirror structure"] },
  {
    canonicalName: "Second-person invitations",
    variants: ["second person invitations", "second-person invitations"],
  },
  {
    canonicalName: "Home–departure–return arc",
    variants: ["home departure return", "home-departure-return", "departure return home"],
  },
  {
    canonicalName: "Memory-driven time movement",
    variants: ["memory driven time", "memory-driven chronology", "memory time movement"],
  },
  {
    canonicalName: "Symbolic recurrences across time shifts",
    variants: ["symbolic recurrences", "symbolic recurrence time"],
  },
];

function matchesVariant(norm: string, variants: string[]): boolean {
  for (const v of variants) {
    const nv = normalizeSymbolName(v);
    if (!nv) continue;
    if (norm === nv) return true;
    if (norm.includes(nv) || nv.includes(norm)) {
      if (Math.min(norm.length, nv.length) >= 4) return true;
    }
  }
  return false;
}

function mergeNotesParts(...parts: (string | null | undefined)[]): string | undefined {
  const cleaned = parts.map((p) => p?.trim()).filter(Boolean) as string[];
  if (!cleaned.length) return undefined;
  return cleaned.join("\n\n—\n\n").slice(0, 48_000);
}

function mergeJsonLayers(
  a: Prisma.JsonValue | null | undefined,
  b: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | undefined {
  const out = new Set<string>();
  for (const src of [a, b]) {
    if (Array.isArray(src)) {
      for (const x of src) {
        if (typeof x === "string" && x.trim()) out.add(x.trim());
      }
    }
  }
  return out.size ? ([...out] as Prisma.InputJsonValue) : undefined;
}

async function redirectBindingsForEntity(
  tx: Prisma.TransactionClient,
  entityType: string,
  fromId: string,
  toId: string,
): Promise<void> {
  const asSource = await tx.narrativeBinding.findMany({
    where: { sourceType: entityType, sourceId: fromId },
  });
  for (const b of asSource) {
    const dup = await tx.narrativeBinding.findFirst({
      where: {
        sourceType: entityType,
        sourceId: toId,
        targetType: b.targetType,
        targetId: b.targetId,
        relationship: b.relationship,
      },
    });
    if (dup) {
      await tx.narrativeBinding.delete({ where: { id: b.id } });
    } else {
      await tx.narrativeBinding.update({
        where: { id: b.id },
        data: { sourceId: toId, notes: mergeNotesParts(b.notes, `[consolidation] redirected from ${fromId}`) },
      });
    }
  }

  const asTarget = await tx.narrativeBinding.findMany({
    where: { targetType: entityType, targetId: fromId },
  });
  for (const b of asTarget) {
    const dup = await tx.narrativeBinding.findFirst({
      where: {
        sourceType: b.sourceType,
        sourceId: b.sourceId,
        targetType: entityType,
        targetId: toId,
        relationship: b.relationship,
      },
    });
    if (dup) {
      await tx.narrativeBinding.delete({ where: { id: b.id } });
    } else {
      await tx.narrativeBinding.update({
        where: { id: b.id },
        data: { targetId: toId, notes: mergeNotesParts(b.notes, `[consolidation] redirected from ${fromId}`) },
      });
    }
  }
}

export async function mergeNarrativeDnaDuplicatesActionImpl(
  canonicalId: string,
  duplicateId: string,
  type:
    | "symbol"
    | "theme"
    | "motif"
    | "narrative_rule"
    | "literary_device"
    | "narrative_pattern",
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canonicalId?.trim() || !duplicateId?.trim() || canonicalId === duplicateId) {
    return { ok: false, error: "Invalid ids." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      if (type === "symbol") {
        const [keep, lose] = await Promise.all([
          tx.symbol.findUnique({
            where: { id: canonicalId },
            include: { scenes: { select: { id: true } } },
          }),
          tx.symbol.findUnique({
            where: { id: duplicateId },
            include: { scenes: { select: { id: true } } },
          }),
        ]);
        if (!keep || !lose) throw new Error("Symbol not found.");
        await redirectBindingsForEntity(tx, "symbol", lose.id, keep.id);
        await tx.fragmentCluster.updateMany({
          where: { symbolId: lose.id },
          data: { symbolId: keep.id },
        });
        const sceneIds = lose.scenes.map((s) => s.id);
        if (sceneIds.length) {
          await tx.symbol.update({
            where: { id: keep.id },
            data: { scenes: { connect: sceneIds.map((id) => ({ id })) } },
          });
        }
        await tx.symbol.update({
          where: { id: keep.id },
          data: {
            meaningPrimary: mergeNotesParts(keep.meaningPrimary, lose.meaningPrimary) ?? keep.meaningPrimary,
            meaningSecondary: mergeNotesParts(keep.meaningSecondary, lose.meaningSecondary),
            emotionalTone: keep.emotionalTone?.trim() || lose.emotionalTone?.trim() || null,
            usageContext: mergeNotesParts(keep.usageContext, lose.usageContext),
            certainty: keep.certainty?.trim() || lose.certainty?.trim() || null,
            meaning: mergeNotesParts(keep.meaning, lose.meaning),
            sourceTraceNote: mergeNotesParts(
              keep.sourceTraceNote,
              lose.sourceTraceNote,
              `[merge] absorbed duplicate symbol ${lose.id} (${lose.name})`,
            ),
            layers: mergeJsonLayers(keep.layers, lose.layers),
          },
        });
        await tx.symbol.delete({ where: { id: lose.id } });
        return;
      }

      if (type === "theme") {
        const [keep, lose] = await Promise.all([
          tx.theme.findUnique({ where: { id: canonicalId } }),
          tx.theme.findUnique({ where: { id: duplicateId } }),
        ]);
        if (!keep || !lose) throw new Error("Theme not found.");
        await redirectBindingsForEntity(tx, "theme", lose.id, keep.id);
        await tx.theme.update({
          where: { id: keep.id },
          data: {
            description: mergeNotesParts(keep.description, lose.description) ?? keep.description,
            notes: mergeNotesParts(keep.notes, lose.notes, `[merge] absorbed ${lose.id}`),
            layers: mergeJsonLayers(keep.layers, lose.layers),
          },
        });
        await tx.theme.delete({ where: { id: lose.id } });
        return;
      }

      if (type === "motif") {
        const [keep, lose] = await Promise.all([
          tx.motif.findUnique({ where: { id: canonicalId } }),
          tx.motif.findUnique({ where: { id: duplicateId } }),
        ]);
        if (!keep || !lose) throw new Error("Motif not found.");
        await redirectBindingsForEntity(tx, "motif", lose.id, keep.id);
        await tx.motif.update({
          where: { id: keep.id },
          data: {
            description: mergeNotesParts(keep.description, lose.description) ?? keep.description,
            usagePattern: keep.usagePattern?.trim() || lose.usagePattern?.trim() || null,
            notes: mergeNotesParts(keep.notes, lose.notes, `[merge] absorbed ${lose.id}`),
            layers: mergeJsonLayers(keep.layers, lose.layers),
          },
        });
        await tx.motif.delete({ where: { id: lose.id } });
        return;
      }

      if (type === "narrative_rule") {
        const [keep, lose] = await Promise.all([
          tx.narrativeRule.findUnique({ where: { id: canonicalId } }),
          tx.narrativeRule.findUnique({ where: { id: duplicateId } }),
        ]);
        if (!keep || !lose) throw new Error("Rule not found.");
        await redirectBindingsForEntity(tx, "narrative_rule", lose.id, keep.id);
        await tx.narrativeRule.update({
          where: { id: keep.id },
          data: {
            description: mergeNotesParts(keep.description, lose.description) ?? keep.description,
            notes: mergeNotesParts(keep.notes, lose.notes, `[merge] absorbed ${lose.id}`),
            layers: mergeJsonLayers(keep.layers, lose.layers),
          },
        });
        await tx.narrativeRule.delete({ where: { id: lose.id } });
        return;
      }

      if (type === "literary_device") {
        const [keep, lose] = await Promise.all([
          tx.literaryDevice.findUnique({ where: { id: canonicalId } }),
          tx.literaryDevice.findUnique({ where: { id: duplicateId } }),
        ]);
        if (!keep || !lose) throw new Error("Device not found.");
        await redirectBindingsForEntity(tx, "literary_device", lose.id, keep.id);
        await tx.literaryDevice.update({
          where: { id: keep.id },
          data: {
            description: mergeNotesParts(keep.description, lose.description) ?? keep.description,
            systemEffect: mergeNotesParts(keep.systemEffect, lose.systemEffect) ?? keep.systemEffect,
            notes: mergeNotesParts(keep.notes, lose.notes, `[merge] absorbed ${lose.id}`),
            layers: mergeJsonLayers(keep.layers, lose.layers),
          },
        });
        await tx.literaryDevice.delete({ where: { id: lose.id } });
        return;
      }

      if (type === "narrative_pattern") {
        const [keep, lose] = await Promise.all([
          tx.narrativePattern.findUnique({ where: { id: canonicalId } }),
          tx.narrativePattern.findUnique({ where: { id: duplicateId } }),
        ]);
        if (!keep || !lose) throw new Error("Pattern not found.");
        await redirectBindingsForEntity(tx, "narrative_pattern", lose.id, keep.id);
        await tx.narrativePattern.update({
          where: { id: keep.id },
          data: {
            description: mergeNotesParts(keep.description, lose.description) ?? keep.description,
            notes: mergeNotesParts(keep.notes, lose.notes, `[merge] absorbed ${lose.id}`),
            layers: mergeJsonLayers(keep.layers, lose.layers),
          },
        });
        await tx.narrativePattern.delete({ where: { id: lose.id } });
        return;
      }
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Merge failed.";
    return { ok: false, error: msg };
  }
}

async function mergeSymbolGroup(g: SymbolGroup): Promise<number> {
  const rows = await prisma.symbol.findMany({
    select: {
      id: true,
      name: true,
      meaningPrimary: true,
      meaning: true,
      sourceId: true,
    },
  });
  const hits = rows.filter((r) => matchesVariant(normalizeSymbolName(r.name), g.variants));
  if (hits.length < 2) return 0;
  hits.sort((a, b) => a.id.localeCompare(b.id));
  const canonical = hits[0]!;
  let merged = 0;
  for (let i = 1; i < hits.length; i++) {
    const dup = hits[i]!;
    const r = await mergeNarrativeDnaDuplicatesActionImpl(canonical.id, dup.id, "symbol");
    if (r.ok) {
      merged++;
      const cur = await prisma.symbol.findUnique({
        where: { id: canonical.id },
        select: { sourceTraceNote: true },
      });
      await prisma.symbol.update({
        where: { id: canonical.id },
        data: {
          name: g.canonicalName,
          sourceTraceNote: mergeNotesParts(
            cur?.sourceTraceNote,
            `[policy] canonical label: ${g.canonicalName}`,
          ),
        },
      });
    }
  }
  return merged;
}

async function mergeThemeGroup(g: ThemeGroup): Promise<number> {
  const rows = await prisma.theme.findMany({ select: { id: true, name: true } });
  const hits = rows.filter((r) => matchesVariant(normalizeThemeName(r.name), g.variants));
  if (hits.length < 2) return 0;
  hits.sort((a, b) => a.id.localeCompare(b.id));
  const canonical = hits[0]!;
  let merged = 0;
  for (let i = 1; i < hits.length; i++) {
    const r = await mergeNarrativeDnaDuplicatesActionImpl(canonical.id, hits[i]!.id, "theme");
    if (r.ok) {
      merged++;
      await prisma.theme.update({
        where: { id: canonical.id },
        data: { name: g.canonicalName },
      });
    }
  }
  return merged;
}

async function mergeRuleLike(
  policy: RuleDevGroup[],
  kind: "narrative_rule" | "literary_device",
): Promise<number> {
  let merged = 0;
  const rules =
    kind === "narrative_rule"
      ? await prisma.narrativeRule.findMany({ select: { id: true, title: true } })
      : null;
  const devices =
    kind === "literary_device"
      ? await prisma.literaryDevice.findMany({ select: { id: true, name: true } })
      : null;

  for (const g of policy) {
    const rows =
      kind === "narrative_rule"
        ? (rules ?? []).map((r) => ({ id: r.id, label: r.title }))
        : (devices ?? []).map((r) => ({ id: r.id, label: r.name }));
    const hits = rows.filter((r) => matchesVariant(normalizeRuleTitle(r.label), g.variants));
    if (hits.length < 2) continue;
    hits.sort((a, b) => a.id.localeCompare(b.id));
    const canonical = hits[0]!;
    for (let i = 1; i < hits.length; i++) {
      const r = await mergeNarrativeDnaDuplicatesActionImpl(
        canonical.id,
        hits[i]!.id,
        kind === "narrative_rule" ? "narrative_rule" : "literary_device",
      );
      if (r.ok) {
        merged++;
        if (kind === "narrative_rule") {
          await prisma.narrativeRule.update({
            where: { id: canonical.id },
            data: { title: g.canonicalName },
          });
        } else {
          await prisma.literaryDevice.update({
            where: { id: canonical.id },
            data: { name: g.canonicalName },
          });
        }
      }
    }
  }
  return merged;
}

async function linkWaterLakeVariants(): Promise<number> {
  const rows = await prisma.symbol.findMany({ select: { id: true, name: true } });
  const water = rows.find((r) => normalizeSymbolName(r.name) === "water");
  if (!water) return 0;
  const lakeHints = ["black lake", "peckerwood lake", "lake"];
  let n = 0;
  for (const r of rows) {
    const nn = normalizeSymbolName(r.name);
    if (r.id === water.id) continue;
    if (!lakeHints.some((h) => nn.includes(h))) continue;
    await createBindingIfFresh({
      sourceType: "symbol",
      sourceId: r.id,
      targetType: "symbol",
      targetId: water.id,
      relationship: "expresses",
      strength: 2,
      notes: "Related water-body symbol — parent/child (consolidation policy).",
    });
    n++;
  }
  return n;
}

function tokenizeForRebind(text: string): Set<string> {
  return tokenSet(text);
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) {
    if (b.has(x)) n++;
  }
  return n;
}

/**
 * Heuristic rebinding: DNA entities → scenes, places, people, fragments, chapters, relationships.
 */
export async function autoRebindNarrativeDnaToWorld(): Promise<{ bindingsCreated: number }> {
  const [symbols, themes, rules, scenes, places, people, fragments, chapters, rels] = await Promise.all([
    prisma.symbol.findMany({
      take: 150,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        meaning: true,
        meaningPrimary: true,
        meaningSecondary: true,
        usageContext: true,
      },
    }),
    prisma.theme.findMany({
      take: 120,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, description: true },
    }),
    prisma.narrativeRule.findMany({
      take: 120,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, description: true, category: true },
    }),
    prisma.scene.findMany({
      take: 200,
      orderBy: { updatedAt: "desc" },
      select: { id: true, description: true, summary: true, draftText: true, narrativeIntent: true },
    }),
    prisma.place.findMany({
      take: 120,
      select: { id: true, name: true, description: true },
    }),
    prisma.person.findMany({
      take: 200,
      select: { id: true, name: true, description: true },
    }),
    prisma.fragment.findMany({
      take: 120,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, text: true },
    }),
    prisma.chapter.findMany({
      take: 80,
      select: { id: true, title: true, summary: true },
    }),
    prisma.characterRelationship.findMany({
      take: 80,
      select: {
        id: true,
        relationshipSummary: true,
        emotionalPattern: true,
        personAId: true,
        personBId: true,
      },
    }),
  ]);

  let bindingsCreated = 0;

  const tryBind = async (input: NarrativeBindingInput) => {
    const existing = await prisma.narrativeBinding.findFirst({
      where: bindingDuplicateWhere(input),
    });
    if (existing) return;
    await createBindingIfFresh(input);
    bindingsCreated++;
  };

  for (const sym of symbols) {
    const blob = `${sym.name} ${sym.meaning ?? ""} ${sym.meaningPrimary ?? ""} ${sym.meaningSecondary ?? ""} ${sym.usageContext ?? ""}`;
    const T = tokenizeForRebind(blob);
    if (T.size < 2) continue;

    for (const sc of scenes) {
      const u = tokenizeForRebind(`${sc.summary ?? ""} ${sc.description} ${sc.draftText ?? ""} ${sc.narrativeIntent ?? ""}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "symbol",
          sourceId: sym.id,
          targetType: "scene",
          targetId: sc.id,
          relationship: "influences",
          strength: 3,
          notes: "Auto rebind (consolidation): token overlap with scene text.",
        });
      }
    }
    for (const pl of places) {
      const u = tokenizeForRebind(`${pl.name} ${pl.description ?? ""}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "symbol",
          sourceId: sym.id,
          targetType: "place",
          targetId: pl.id,
          relationship: "influences",
          strength: 3,
          notes: "Auto rebind: symbol ↔ place overlap.",
        });
      }
    }
    for (const p of people) {
      const u = tokenizeForRebind(`${p.name} ${p.description ?? ""}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "symbol",
          sourceId: sym.id,
          targetType: "person",
          targetId: p.id,
          relationship: "influences",
          strength: 2,
          notes: "Auto rebind: symbol ↔ person overlap.",
        });
      }
    }
    for (const f of fragments) {
      const u = tokenizeForRebind(`${f.title ?? ""} ${f.text}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "symbol",
          sourceId: sym.id,
          targetType: "fragment",
          targetId: f.id,
          relationship: "expresses",
          strength: 2,
          notes: "Auto rebind: symbol ↔ fragment overlap.",
        });
      }
    }
  }

  for (const th of themes) {
    const T = tokenizeForRebind(`${th.name} ${th.description}`);
    if (T.size < 2) continue;
    for (const sc of scenes) {
      const u = tokenizeForRebind(`${sc.summary ?? ""} ${sc.description} ${sc.draftText ?? ""}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "theme",
          sourceId: th.id,
          targetType: "scene",
          targetId: sc.id,
          relationship: "influences",
          strength: 3,
          notes: "Auto rebind: theme ↔ scene.",
        });
      }
    }
    for (const ch of chapters) {
      const u = tokenizeForRebind(`${ch.title} ${ch.summary ?? ""}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "theme",
          sourceId: th.id,
          targetType: "chapter",
          targetId: ch.id,
          relationship: "influences",
          strength: 3,
          notes: "Auto rebind: theme ↔ chapter.",
        });
      }
    }
  }

  for (const rule of rules) {
    const T = tokenizeForRebind(`${rule.title} ${rule.description}`);
    if (T.size < 3) continue;
    if (!/structure|pacing|chapter|arc|memory|silence/i.test(rule.category + rule.title + rule.description))
      continue;
    for (const ch of chapters) {
      const u = tokenizeForRebind(`${ch.title} ${ch.summary ?? ""}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "narrative_rule",
          sourceId: rule.id,
          targetType: "chapter",
          targetId: ch.id,
          relationship: "influences",
          strength: 4,
          notes: "Auto rebind: structural rule ↔ chapter (Section V class).",
        });
      }
    }
    for (const sc of scenes) {
      const u = tokenizeForRebind(`${sc.summary ?? ""} ${sc.description}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "narrative_rule",
          sourceId: rule.id,
          targetType: "scene",
          targetId: sc.id,
          relationship: "influences",
          strength: 3,
          notes: "Auto rebind: rule ↔ scene.",
        });
      }
    }
  }

  for (const rel of rels) {
    const T = tokenizeForRebind(`${rel.relationshipSummary ?? ""} ${rel.emotionalPattern ?? ""}`);
    if (T.size < 2) continue;
    for (const th of themes) {
      const u = tokenizeForRebind(`${th.name} ${th.description}`);
      if (overlap(T, u) >= 2) {
        await tryBind({
          sourceType: "theme",
          sourceId: th.id,
          targetType: "person",
          targetId: rel.personAId,
          relationship: "influences",
          strength: 2,
          notes: `Auto rebind: theme ↔ relationship ${rel.id} (person A).`,
        });
      }
    }
  }

  return { bindingsCreated };
}

export type ConsolidationResult = {
  sourceIds: string[];
  symbolsMerged: number;
  themesMerged: number;
  rulesDevicesMerged: number;
  waterLinks: number;
  similarityMerged: { symbols: number; themes: number };
};

async function mergeBySimilarity(
  threshold: number,
): Promise<{ symbols: number; themes: number }> {
  let symbols = 0;
  let themes = 0;

  const symRows = await prisma.symbol.findMany({
    select: { id: true, name: true, meaningPrimary: true, meaning: true },
  });
  const seenS = new Set<string>();
  for (let i = 0; i < symRows.length; i++) {
    for (let j = i + 1; j < symRows.length; j++) {
      const a = symRows[i]!;
      const b = symRows[j]!;
      const key = [a.id, b.id].sort().join(":");
      if (seenS.has(key)) continue;
      if (normalizeSymbolName(a.name) !== normalizeSymbolName(b.name)) continue;
      const sim = scoreNarrativeDnaSimilarity(
        { label: a.name, body: `${a.meaningPrimary ?? ""} ${a.meaning ?? ""}` },
        { label: b.name, body: `${b.meaningPrimary ?? ""} ${b.meaning ?? ""}` },
      );
      if (sim < threshold) continue;
      const [keep, lose] = a.id < b.id ? [a, b] : [b, a];
      const r = await mergeNarrativeDnaDuplicatesActionImpl(keep.id, lose.id, "symbol");
      if (r.ok) {
        symbols++;
        seenS.add(key);
      }
    }
  }

  const thRows = await prisma.theme.findMany({
    select: { id: true, name: true, description: true },
  });
  const seenT = new Set<string>();
  for (let i = 0; i < thRows.length; i++) {
    for (let j = i + 1; j < thRows.length; j++) {
      const a = thRows[i]!;
      const b = thRows[j]!;
      const key = [a.id, b.id].sort().join(":");
      if (seenT.has(key)) continue;
      if (normalizeThemeName(a.name) !== normalizeThemeName(b.name)) continue;
      const sim = scoreNarrativeDnaSimilarity(
        { label: a.name, body: a.description },
        { label: b.name, body: b.description },
      );
      if (sim < threshold) continue;
      const [keep, lose] = a.id < b.id ? [a, b] : [b, a];
      const r = await mergeNarrativeDnaDuplicatesActionImpl(keep.id, lose.id, "theme");
      if (r.ok) {
        themes++;
        seenT.add(key);
      }
    }
  }

  return { symbols, themes };
}

/** Public API: policy merges + optional similarity pass + water variant links. `sourceIds` scopes reporting only. */
export async function consolidateNarrativeDnaForSources(
  sourceIds: string[],
): Promise<ConsolidationResult> {
  let symbolsMerged = 0;
  for (const g of SYMBOL_MERGE_POLICY) {
    symbolsMerged += await mergeSymbolGroup(g);
  }

  let themesMerged = 0;
  for (const g of THEME_MERGE_POLICY) {
    themesMerged += await mergeThemeGroup(g);
  }

  let rulesDevicesMerged = 0;
  rulesDevicesMerged += await mergeRuleLike(RULE_DEVICE_MERGE_POLICY, "narrative_rule");
  rulesDevicesMerged += await mergeRuleLike(RULE_DEVICE_MERGE_POLICY, "literary_device");

  const waterLinks = await linkWaterLakeVariants();

  const similarityMerged = await mergeBySimilarity(0.55);

  return {
    sourceIds,
    symbolsMerged,
    themesMerged,
    rulesDevicesMerged,
    waterLinks,
    similarityMerged,
  };
}

export async function mergeDuplicateSymbols(): Promise<number> {
  let n = 0;
  for (const g of SYMBOL_MERGE_POLICY) n += await mergeSymbolGroup(g);
  return n;
}

export async function mergeDuplicateThemes(): Promise<number> {
  let n = 0;
  for (const g of THEME_MERGE_POLICY) n += await mergeThemeGroup(g);
  return n;
}

export async function mergeDuplicateMotifs(): Promise<number> {
  const motifs = await prisma.motif.findMany({ select: { id: true, name: true } });
  const byNorm = new Map<string, typeof motifs>();
  for (const m of motifs) {
    const k = normalizeThemeName(m.name);
    const arr = byNorm.get(k) ?? [];
    arr.push(m);
    byNorm.set(k, arr);
  }
  let merged = 0;
  for (const [, group] of byNorm) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.id.localeCompare(b.id));
    const keep = group[0]!;
    for (let i = 1; i < group.length; i++) {
      const r = await mergeNarrativeDnaDuplicatesActionImpl(keep.id, group[i]!.id, "motif");
      if (r.ok) merged++;
    }
  }
  return merged;
}

export async function mergeDuplicateNarrativeRules(): Promise<number> {
  return mergeRuleLike(RULE_DEVICE_MERGE_POLICY, "narrative_rule");
}

export async function mergeDuplicateLiteraryDevices(): Promise<number> {
  return mergeRuleLike(RULE_DEVICE_MERGE_POLICY, "literary_device");
}

export async function mergeDuplicateNarrativePatterns(): Promise<number> {
  const patterns = await prisma.narrativePattern.findMany({ select: { id: true, title: true } });
  const byNorm = new Map<string, typeof patterns>();
  for (const p of patterns) {
    const k = normalizeRuleTitle(p.title);
    const arr = byNorm.get(k) ?? [];
    arr.push(p);
    byNorm.set(k, arr);
  }
  let merged = 0;
  for (const [, group] of byNorm) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.id.localeCompare(b.id));
    const keep = group[0]!;
    for (let i = 1; i < group.length; i++) {
      const r = await mergeNarrativeDnaDuplicatesActionImpl(keep.id, group[i]!.id, "narrative_pattern");
      if (r.ok) merged++;
    }
  }
  return merged;
}
