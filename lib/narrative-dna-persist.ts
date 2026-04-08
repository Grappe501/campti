import type { Prisma } from "@prisma/client";
import { SymbolCategory } from "@prisma/client";
import type { FullNarrativeDnaResult } from "@/lib/narrative-dna-extractor";
import { wipeNarrativeDnaRowsForSource } from "@/lib/narrative-binding";

export function mapSymbolCategory(raw: string | null | undefined): SymbolCategory | null {
  if (!raw) return null;
  const k = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const m: Record<string, SymbolCategory> = {
    element: SymbolCategory.ELEMENTAL,
    elemental: SymbolCategory.ELEMENTAL,
    food: SymbolCategory.CULINARY,
    culinary: SymbolCategory.CULINARY,
    plant: SymbolCategory.LANDSCAPE,
    landscape: SymbolCategory.LANDSCAPE,
    religious: SymbolCategory.RELIGIOUS,
    family_sym: SymbolCategory.FAMILY,
    family: SymbolCategory.FAMILY,
    ritual: SymbolCategory.RITUAL,
    symbol_other: SymbolCategory.OTHER,
    other: SymbolCategory.OTHER,
  };
  return m[k] ?? null;
}

const asJson = (layers: string[] | null | undefined): Prisma.InputJsonValue | undefined =>
  layers?.length ? (layers as Prisma.InputJsonValue) : undefined;

/**
 * Replace prior DNA rows for this source and persist a fresh extraction (+ emerges_from bindings).
 */
export async function persistNarrativeDnaExtraction(
  tx: Prisma.TransactionClient,
  sourceId: string,
  source: { visibility: import("@prisma/client").VisibilityStatus; recordType: import("@prisma/client").RecordType },
  dna: FullNarrativeDnaResult,
): Promise<{
  createdRuleIds: string[];
  createdThemeIds: string[];
  createdSymbolIds: string[];
  createdMotifIds: string[];
  createdDeviceIds: string[];
  createdPatternIds: string[];
}> {
  await wipeNarrativeDnaRowsForSource(tx, sourceId);

  const createdRuleIds: string[] = [];
  const createdThemeIds: string[] = [];
  const createdSymbolIds: string[] = [];
  const createdMotifIds: string[] = [];
  const createdDeviceIds: string[] = [];
  const createdPatternIds: string[] = [];

  for (const r of dna.rules) {
    const row = await tx.narrativeRule.create({
      data: {
        title: r.title,
        description: r.description,
        category: r.category,
        strength: r.strength ?? undefined,
        scope: r.scope ?? undefined,
        sourceId,
        notes: r.uncertaintyNote?.trim() || undefined,
        layers: asJson(r.layers),
      },
    });
    createdRuleIds.push(row.id);
  }

  for (const t of dna.themes) {
    const row = await tx.theme.create({
      data: {
        name: t.name,
        description: t.description,
        intensity: t.intensity ?? undefined,
        category: t.category ?? undefined,
        sourceId,
        notes: t.uncertaintyNote?.trim() || undefined,
        layers: asJson(t.layers),
      },
    });
    createdThemeIds.push(row.id);
  }

  for (const s of dna.symbols) {
    const cat = mapSymbolCategory(s.symbolCategory);
    const row = await tx.symbol.create({
      data: {
        name: s.name,
        meaning: s.meaningPrimary.slice(0, 4000),
        meaningPrimary: s.meaningPrimary,
        meaningSecondary: s.meaningSecondary ?? undefined,
        emotionalTone: s.emotionalTone ?? undefined,
        usageContext: s.usageContext ?? undefined,
        certainty: s.certainty ?? undefined,
        category: cat ?? undefined,
        visibility: source.visibility,
        recordType: source.recordType,
        sourceId,
        sourceTraceNote: s.uncertaintyNote?.trim() || undefined,
        layers: asJson(s.layers),
      },
    });
    createdSymbolIds.push(row.id);
  }

  for (const m of dna.motifs) {
    const row = await tx.motif.create({
      data: {
        name: m.name,
        description: m.description,
        usagePattern: m.usagePattern ?? undefined,
        sourceId,
        notes: m.uncertaintyNote?.trim() || undefined,
        layers: asJson(m.layers),
      },
    });
    createdMotifIds.push(row.id);
  }

  for (const d of dna.literaryDevices) {
    const row = await tx.literaryDevice.create({
      data: {
        name: d.name,
        description: d.description,
        systemEffect: d.systemEffect,
        sourceId,
        notes: d.uncertaintyNote?.trim() || undefined,
        layers: asJson(d.layers),
      },
    });
    createdDeviceIds.push(row.id);
  }

  for (const p of dna.patterns) {
    const row = await tx.narrativePattern.create({
      data: {
        title: p.title,
        description: p.description,
        patternType: p.patternType,
        strength: p.strength ?? undefined,
        sourceId,
        notes: p.uncertaintyNote?.trim() || undefined,
        layers: asJson(p.layers),
      },
    });
    createdPatternIds.push(row.id);
  }

  const bindEmerges = async (entityType: string, ids: string[]) => {
    for (const id of ids) {
      await tx.narrativeBinding.create({
        data: {
          sourceType: entityType,
          sourceId: id,
          targetType: "source",
          targetId: sourceId,
          relationship: "emerges_from",
          strength: 4,
          notes: "Created by narrative DNA extraction.",
        },
      });
    }
  };

  await bindEmerges("narrative_rule", createdRuleIds);
  await bindEmerges("theme", createdThemeIds);
  await bindEmerges("symbol", createdSymbolIds);
  await bindEmerges("motif", createdMotifIds);
  await bindEmerges("literary_device", createdDeviceIds);
  await bindEmerges("narrative_pattern", createdPatternIds);

  return {
    createdRuleIds,
    createdThemeIds,
    createdSymbolIds,
    createdMotifIds,
    createdDeviceIds,
    createdPatternIds,
  };
}
