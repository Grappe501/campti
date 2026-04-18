import { prisma } from "@/lib/prisma";
import type {
  SceneRunBoundedOutputDiff,
  SceneRunOutputEntityMentionDelta,
  SceneRunOutputSignal,
  SceneRunOutputStructureSummary,
} from "@/lib/domain/scene-run-output-linkage";

export type SceneEntityLexiconEntry = { id: string; kind: "person" | "place"; name: string };

function paragraphCount(text: string): number {
  const parts = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return parts.length > 0 ? parts.length : text.trim() ? 1 : 0;
}

function hasBeatLikeMarkers(text: string): boolean {
  return /^\s*(#{1,3}\s+|(?:BEAT|Beat|SCENE|Scene)\s*[:\-])/m.test(text);
}

export function summarizeOutputStructure(text: string): SceneRunOutputStructureSummary {
  return {
    paragraphCount: paragraphCount(text),
    characterCount: text.length,
    hasBeatLikeMarkers: hasBeatLikeMarkers(text),
  };
}

function countInsensitive(haystack: string, needle: string): number {
  if (!needle.trim()) return 0;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(esc, "gi");
  return (haystack.match(re) ?? []).length;
}

export function entityMentionDeltas(
  textA: string,
  textB: string,
  lexicon: SceneEntityLexiconEntry[],
): SceneRunOutputEntityMentionDelta[] {
  const out: SceneRunOutputEntityMentionDelta[] = [];
  for (const e of lexicon) {
    const ca = countInsensitive(textA, e.name);
    const cb = countInsensitive(textB, e.name);
    if (ca === 0 && cb === 0) continue;
    out.push({
      entityId: e.id,
      kind: e.kind,
      label: e.name,
      countA: ca,
      countB: cb,
      delta: cb - ca,
      kind_note: "fact",
    });
  }
  return out.slice(0, 24);
}

const CHAR_MATERIAL_RATIO = 0.12;
const CHAR_MATERIAL_ABS = 400;

export function computeBoundedSceneRunOutputDiff(
  textA: string,
  textB: string,
  fingerprintOpenA: string,
  fingerprintOpenB: string,
  fingerprintEndA: string,
  fingerprintEndB: string,
  structureA: SceneRunOutputStructureSummary,
  structureB: SceneRunOutputStructureSummary,
  lexicon: SceneEntityLexiconEntry[],
): SceneRunBoundedOutputDiff {
  const entities = entityMentionDeltas(textA, textB, lexicon);
  const charDelta = textB.length - textA.length;
  const paraDelta = structureB.paragraphCount - structureA.paragraphCount;
  const base = Math.max(textA.length, textB.length, 1);
  const materialByRatio = Math.abs(charDelta) / base >= CHAR_MATERIAL_RATIO;
  const materialByAbs = Math.abs(charDelta) >= CHAR_MATERIAL_ABS;
  const lengthMaterial = materialByRatio || materialByAbs;

  const openingChanged = fingerprintOpenA !== fingerprintOpenB;
  const endingChanged = fingerprintEndA !== fingerprintEndB;

  const signals: SceneRunOutputSignal[] = [];
  if (lengthMaterial) {
    signals.push({
      code: "length_shift",
      label: "Length changed materially",
      description: `Character count delta ${charDelta > 0 ? "+" : ""}${charDelta} (bounded threshold: ≥${Math.round(CHAR_MATERIAL_RATIO * 100)}% of longer or ≥${CHAR_MATERIAL_ABS} chars).`,
      derivation: "fact",
    });
  }
  if (openingChanged) {
    signals.push({
      code: "opening_shift",
      label: "Opening fingerprint changed",
      description: "First ~200 normalized characters hash differs — not a literary judgment.",
      derivation: "fact",
    });
  }
  if (endingChanged) {
    signals.push({
      code: "ending_shift",
      label: "Ending fingerprint changed",
      description: "Last ~200 normalized characters hash differs.",
      derivation: "fact",
    });
  }
  if (structureA.paragraphCount !== structureB.paragraphCount) {
    signals.push({
      code: "paragraph_structure_shift",
      label: "Paragraph count changed",
      description: `Paragraphs ${structureA.paragraphCount} → ${structureB.paragraphCount} (whitespace-split heuristic).`,
      derivation: "fact",
    });
  }
  if (structureA.hasBeatLikeMarkers !== structureB.hasBeatLikeMarkers) {
    signals.push({
      code: "beat_marker_presence_shift",
      label: "Beat/section marker presence changed",
      description: "Lightweight pattern match on headings or BEAT/SCENE prefixes — approximate.",
      derivation: "heuristic",
    });
  }

  let charLabel: string | null = null;
  if (charDelta === 0) charLabel = "unchanged length";
  else if (lengthMaterial) charLabel = charDelta > 0 ? "material increase" : "material decrease";
  else charLabel = "minor length change";

  return {
    bothLinked: true,
    linkageNote: "Both runs have durable `SceneRunGenerationOutput` snapshots.",
    existence: {
      aPresent: textA.length > 0,
      bPresent: textB.length > 0,
      summary:
        textA.length === 0 || textB.length === 0
          ? "One output is empty — compare is still bounded on available text."
          : "Both outputs present in linkage store.",
    },
    length: {
      charDelta,
      paragraphDelta: paraDelta,
      charDeltaLabel: charLabel,
      kind: "fact",
    },
    opening: {
      changed: openingChanged,
      summary: openingChanged ? "Opening slice fingerprint differs." : "Opening slice fingerprint matches.",
      kind: "fact",
    },
    ending: {
      changed: endingChanged,
      summary: endingChanged ? "Ending slice fingerprint differs." : "Ending slice fingerprint matches.",
      kind: "fact",
    },
    structure: {
      paragraphCountChanged: structureA.paragraphCount !== structureB.paragraphCount,
      beatMarkersChanged: structureA.hasBeatLikeMarkers !== structureB.hasBeatLikeMarkers,
      summary: `Paragraphs A:${structureA.paragraphCount} B:${structureB.paragraphCount}; beat-like markers A:${structureA.hasBeatLikeMarkers} B:${structureB.hasBeatLikeMarkers}.`,
      kind: "fact",
    },
    entityMentions: entities,
    signals,
  };
}

export async function loadSceneEntityLexiconForOutputDelta(sceneId: string): Promise<SceneEntityLexiconEntry[]> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: {
      persons: { select: { id: true, name: true } },
      places: { select: { id: true, name: true } },
    },
  });
  if (!scene) return [];
  const out: SceneEntityLexiconEntry[] = [];
  for (const p of scene.persons) {
    if (p.name?.trim()) out.push({ id: p.id, kind: "person", name: p.name.trim() });
  }
  for (const pl of scene.places) {
    if (pl.name?.trim()) out.push({ id: pl.id, kind: "place", name: pl.name.trim() });
  }
  return out;
}

export async function buildBoundedOutputDiffForLedgerKeys(
  sceneId: string,
  ledgerRunKeyA: string,
  ledgerRunKeyB: string,
): Promise<SceneRunBoundedOutputDiff | null> {
  let rows: { ledgerRunKey: string; persistedProse: string; openingFingerprint: string; endingFingerprint: string }[] = [];
  try {
    rows = await prisma.sceneRunGenerationOutput.findMany({
      where: { sceneId, ledgerRunKey: { in: [ledgerRunKeyA, ledgerRunKeyB] } },
      select: {
        ledgerRunKey: true,
        persistedProse: true,
        openingFingerprint: true,
        endingFingerprint: true,
      },
    });
  } catch {
    return null;
  }
  const map = new Map(rows.map((r) => [r.ledgerRunKey, r]));
  const a = map.get(ledgerRunKeyA);
  const b = map.get(ledgerRunKeyB);
  if (!a || !b) return null;

  const lexicon = await loadSceneEntityLexiconForOutputDelta(sceneId);
  const sa = summarizeOutputStructure(a.persistedProse);
  const sb = summarizeOutputStructure(b.persistedProse);

  return computeBoundedSceneRunOutputDiff(
    a.persistedProse,
    b.persistedProse,
    a.openingFingerprint,
    b.openingFingerprint,
    a.endingFingerprint,
    b.endingFingerprint,
    sa,
    sb,
    lexicon,
  );
}
