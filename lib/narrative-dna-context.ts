import { prisma } from "@/lib/prisma";

export type NarrativeDnaSceneSlice = {
  rules: { id: string; title: string; description: string; strength: number | null; scope: string | null }[];
  themes: { id: string; name: string; description: string; intensity: number | null }[];
  symbols: { id: string; name: string; meaningPrimary: string | null; meaning: string | null }[];
  patterns: { id: string; title: string; description: string; patternType: string; strength: number | null }[];
  motifs: { id: string; name: string; description: string; usagePattern: string | null }[];
  literaryDevices: { id: string; name: string; description: string; systemEffect: string }[];
  bindingNotes: string[];
};

async function loadEntitiesForBindings(bindings: { sourceType: string; sourceId: string }[]) {
  const ruleIds = bindings.filter((b) => b.sourceType === "narrative_rule").map((b) => b.sourceId);
  const themeIds = bindings.filter((b) => b.sourceType === "theme").map((b) => b.sourceId);
  const symbolIds = bindings.filter((b) => b.sourceType === "symbol").map((b) => b.sourceId);
  const patternIds = bindings.filter((b) => b.sourceType === "narrative_pattern").map((b) => b.sourceId);
  const motifIds = bindings.filter((b) => b.sourceType === "motif").map((b) => b.sourceId);
  const deviceIds = bindings.filter((b) => b.sourceType === "literary_device").map((b) => b.sourceId);

  const [rules, themes, symbols, patterns, motifs, literaryDevices] = await Promise.all([
    ruleIds.length
      ? prisma.narrativeRule.findMany({
          where: { id: { in: ruleIds } },
          select: { id: true, title: true, description: true, strength: true, scope: true },
        })
      : [],
    themeIds.length
      ? prisma.theme.findMany({
          where: { id: { in: themeIds } },
          select: { id: true, name: true, description: true, intensity: true },
        })
      : [],
    symbolIds.length
      ? prisma.symbol.findMany({
          where: { id: { in: symbolIds } },
          select: { id: true, name: true, meaningPrimary: true, meaning: true },
        })
      : [],
    patternIds.length
      ? prisma.narrativePattern.findMany({
          where: { id: { in: patternIds } },
          select: { id: true, title: true, description: true, patternType: true, strength: true },
        })
      : [],
    motifIds.length
      ? prisma.motif.findMany({
          where: { id: { in: motifIds } },
          select: { id: true, name: true, description: true, usagePattern: true },
        })
      : [],
    deviceIds.length
      ? prisma.literaryDevice.findMany({
          where: { id: { in: deviceIds } },
          select: { id: true, name: true, description: true, systemEffect: true },
        })
      : [],
  ]);

  return { rules, themes, symbols, patterns, motifs, literaryDevices };
}

/**
 * Narrative DNA relevant to a meta scene via bindings on scene, meta_scene, POV person, place, and linked Scene row.
 */
export async function getNarrativeDnaContextForMetaScene(metaSceneId: string): Promise<NarrativeDnaSceneSlice> {
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { id: true, sceneId: true, placeId: true, povPersonId: true },
  });
  if (!meta) {
    return {
      rules: [],
      themes: [],
      symbols: [],
      patterns: [],
      motifs: [],
      literaryDevices: [],
      bindingNotes: [],
    };
  }

  const or: { targetType: string; targetId: string }[] = [
    { targetType: "meta_scene", targetId: meta.id },
    { targetType: "person", targetId: meta.povPersonId },
    { targetType: "place", targetId: meta.placeId },
  ];
  if (meta.sceneId) {
    or.push({ targetType: "scene", targetId: meta.sceneId });
  }

  const bindings = await prisma.narrativeBinding.findMany({
    where: { OR: or },
    take: 120,
    orderBy: { updatedAt: "desc" },
    select: { sourceType: true, sourceId: true, relationship: true, notes: true, strength: true },
  });

  const entities = await loadEntitiesForBindings(bindings);

  const bindingNotes = bindings
    .map((b) => {
      const note = b.notes?.trim();
      return note ? `${b.relationship}: ${note}` : null;
    })
    .filter(Boolean) as string[];

  return {
    rules: entities.rules,
    themes: entities.themes,
    symbols: entities.symbols,
    patterns: entities.patterns,
    motifs: entities.motifs,
    literaryDevices: entities.literaryDevices,
    bindingNotes,
  };
}

/** DNA bound directly to a person (patterns, themes, rules that target this character). */
export async function loadNarrativeDNAForPerson(personId: string): Promise<{
  patterns: { id: string; title: string; patternType: string }[];
  themes: { id: string; name: string }[];
  rules: { id: string; title: string }[];
}> {
  const bindings = await prisma.narrativeBinding.findMany({
    where: { targetType: "person", targetId: personId },
    take: 48,
    orderBy: { updatedAt: "desc" },
  });

  const patternIds = bindings.filter((b) => b.sourceType === "narrative_pattern").map((b) => b.sourceId);
  const themeIds = bindings.filter((b) => b.sourceType === "theme").map((b) => b.sourceId);
  const ruleIds = bindings.filter((b) => b.sourceType === "narrative_rule").map((b) => b.sourceId);

  const [patterns, themes, rules] = await Promise.all([
    patternIds.length
      ? prisma.narrativePattern.findMany({
          where: { id: { in: patternIds } },
          select: { id: true, title: true, patternType: true },
        })
      : [],
    themeIds.length
      ? prisma.theme.findMany({
          where: { id: { in: themeIds } },
          select: { id: true, name: true },
        })
      : [],
    ruleIds.length
      ? prisma.narrativeRule.findMany({
          where: { id: { in: ruleIds } },
          select: { id: true, title: true },
        })
      : [],
  ]);

  return { patterns, themes, rules };
}

function structuralRuleSummary(
  rules: NarrativeDnaSceneSlice["rules"],
): string | null {
  const hits = rules.filter((r) =>
    /chapter|pacing|arc|structure|silence|mystery|revelation|memoir|braid|departure|return|memory|chronolog/i.test(
      `${r.title} ${r.description}`,
    ),
  );
  if (!hits.length) return null;
  return hits
    .slice(0, 5)
    .map((r) => `${r.title}${r.strength ? ` (${r.strength}/5)` : ""}`)
    .join("; ");
}

function spiritualRuleSummary(rules: NarrativeDnaSceneSlice["rules"]): string | null {
  const hits = rules.filter((r) =>
    /sacred|marian|sacrament|eschatolog|theolog|spirit|chapel|grave|flame|smoke|matrilin|lineage holy/i.test(
      `${r.title} ${r.description}`,
    ),
  );
  if (!hits.length) return null;
  return hits
    .slice(0, 4)
    .map((r) => r.title)
    .join("; ");
}

export function formatNarrativeDnaForScenePass(slice: NarrativeDnaSceneSlice): string {
  const parts: string[] = [];
  if (slice.themes.length) {
    parts.push(
      `Themes (bound): ${slice.themes.map((t) => t.name).join("; ")}`,
    );
  }
  if (slice.symbols.length) {
    parts.push(
      `Symbols (bound): ${slice.symbols
        .map((s) => `${s.name} (${s.meaningPrimary ?? s.meaning ?? "—"})`)
        .join("; ")}`,
    );
  }
  if (slice.motifs.length) {
    parts.push(`Motifs (bound): ${slice.motifs.map((m) => m.name).join("; ")}`);
  }
  if (slice.literaryDevices.length) {
    parts.push(
      `Literary devices (bound): ${slice.literaryDevices.map((d) => d.name).join("; ")}`,
    );
  }
  if (slice.rules.length) {
    parts.push(
      `Rules (bound): ${slice.rules.map((r) => `${r.title}${r.strength ? ` [${r.strength}/5]` : ""}`).join("; ")}`,
    );
  }
  const struct = structuralRuleSummary(slice.rules);
  if (struct) {
    parts.push(`Chapter / pacing frame (from bound rules): ${struct}`);
  }
  const spirit = spiritualRuleSummary(slice.rules);
  if (spirit) {
    parts.push(`Sacred undertone (from bound rules): ${spirit}`);
  }
  if (slice.patterns.length) {
    parts.push(
      `Patterns (bound): ${slice.patterns.map((p) => `${p.title} (${p.patternType})`).join("; ")}`,
    );
  }
  if (slice.bindingNotes.length) {
    parts.push(`Binding notes: ${slice.bindingNotes.slice(0, 6).join(" · ")}`);
  }
  return parts.join("\n");
}
