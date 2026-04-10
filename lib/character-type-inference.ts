import type { CharacterProfile, EnneagramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { profileJsonFieldToInferenceText } from "@/lib/profile-json";
import { deriveLikelyBlindSpot, deriveLikelySceneFocus, getEnneagramProfile } from "@/lib/enneagram-engine";

export type EnneagramInferenceCandidate = {
  type: EnneagramType;
  confidence: number; // 1–5
  rationale: string;
};

export type EnneagramInferenceSummary = {
  personId: string;
  authoredType: EnneagramType | null;
  authoredSource: string | null;
  candidates: EnneagramInferenceCandidate[];
  fromFragments: EnneagramInferenceCandidate[];
  fromRelationships: EnneagramInferenceCandidate[];
  note: string;
};

const KEYWORDS: Partial<Record<EnneagramType, RegExp[]>> = {
  ONE: [/\b(wrong|fault|correct|should|duty|moral|integrity|standards)\b/i],
  TWO: [/\b(needed|care|help|love|generous|for others|nurture)\b/i],
  THREE: [/\b(win|success|image|prove|achievement|perform|look good)\b/i],
  FOUR: [/\b(longing|unique|ordinary|shame|aesthetic|identity|missing)\b/i],
  FIVE: [/\b(observe|study|boundary|overwhelm|private|information|reserve)\b/i],
  SIX: [/\b(safe|loyal|authority|threat|support|doubt|anxious)\b/i],
  SEVEN: [/\b(freedom|options|fun|escape|bored|possibilit|avoid pain)\b/i],
  EIGHT: [/\b(power|protect|control|respect|weak|fight|strong)\b/i],
  NINE: [/\b(peace|merge|avoid conflict|comfort|numb|rhythm|harmony)\b/i],
};

function scoreTextForType(text: string, type: EnneagramType): number {
  const pats = KEYWORDS[type];
  if (!pats) return 0;
  let s = 0;
  for (const r of pats) {
    if (r.test(text)) s += 1;
  }
  return s;
}

function textFromProfile(p: CharacterProfile): string {
  return [
    p.worldview,
    profileJsonFieldToInferenceText(p.coreBeliefs),
    profileJsonFieldToInferenceText(p.misbeliefs),
    profileJsonFieldToInferenceText(p.fears),
    profileJsonFieldToInferenceText(p.desires),
    profileJsonFieldToInferenceText(p.internalConflicts),
    p.emotionalBaseline,
    p.behavioralPatterns,
    p.memoryBias,
    p.sensoryBias,
    p.moralFramework,
    p.contradictions,
    p.notes,
    p.coreFear,
    p.coreLonging,
    p.stressPattern,
    p.growthPattern,
    p.attentionBias,
    p.conflictStyle,
    p.relationalStyle,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Heuristic inference from authored profile text — suggestions only.
 */
export function inferEnneagramFromProfile(characterProfile: CharacterProfile | null): EnneagramInferenceCandidate[] {
  if (!characterProfile) return [];
  const blob = textFromProfile(characterProfile);
  if (!blob.trim()) return [];

  const types = Object.keys(KEYWORDS) as EnneagramType[];
  const scored = types
    .map((t) => ({ t, score: scoreTextForType(blob, t) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((row, i) => ({
    type: row.t,
    confidence: Math.min(5, Math.max(1, row.score + 2 - i)),
    rationale: `Keyword overlap in profile text (heuristic rank ${i + 1}). Not clinical typing.`,
  }));
}

/**
 * Scan linked fragments for a person for emotional/narrative keywords.
 */
export async function inferEnneagramFromFragments(personId: string): Promise<EnneagramInferenceCandidate[]> {
  const links = await prisma.fragmentLink.findMany({
    where: { linkedType: "person", linkedId: personId },
    take: 80,
    include: {
      fragment: { select: { text: true, summary: true, emotionalTone: true, narrativeFunction: true } },
    },
  });

  const blob = links
    .map((l) => [l.fragment.text, l.fragment.summary, l.fragment.emotionalTone, l.fragment.narrativeFunction].join(" "))
    .join(" ");

  if (!blob.trim()) return [];

  const types = Object.keys(KEYWORDS) as EnneagramType[];
  const scored = types
    .map((t) => ({ t, score: scoreTextForType(blob, t) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((row, i) => ({
    type: row.t,
    confidence: Math.min(5, Math.max(1, row.score + 1 - i)),
    rationale: `Fragment text/tone overlap (heuristic).`,
  }));
}

/**
 * If relationships exist with enneagramDynamic notes or partner profiles, nudge candidates.
 */
export async function inferEnneagramFromRelationships(personId: string): Promise<EnneagramInferenceCandidate[]> {
  const rels = await prisma.characterRelationship.findMany({
    where: { OR: [{ personAId: personId }, { personBId: personId }] },
    include: {
      personA: { include: { characterProfile: true } },
      personB: { include: { characterProfile: true } },
    },
  });

  const out: EnneagramInferenceCandidate[] = [];
  for (const r of rels) {
    const other = r.personAId === personId ? r.personB.characterProfile : r.personA.characterProfile;
    const t = other?.enneagramType;
    if (t) {
      out.push({
        type: t,
        confidence: 2,
        rationale: `Partner row has authored type ${t}; relational mirroring is not automatic — interpret loosely.`,
      });
    }
  }
  // Dedupe by type, keep highest confidence
  const map = new Map<EnneagramType, EnneagramInferenceCandidate>();
  for (const c of out) {
    const prev = map.get(c.type);
    if (!prev || c.confidence > prev.confidence) map.set(c.type, c);
  }
  return [...map.values()].slice(0, 4);
}

function mergeCandidates(lists: EnneagramInferenceCandidate[]): EnneagramInferenceCandidate[] {
  const map = new Map<EnneagramType, EnneagramInferenceCandidate>();
  for (const c of lists) {
    const prev = map.get(c.type);
    if (!prev || c.confidence > prev.confidence) map.set(c.type, c);
  }
  return [...map.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

/**
 * Aggregated inference summary — never overwrites authored type.
 */
export async function buildEnneagramInferenceSummary(personId: string): Promise<EnneagramInferenceSummary> {
  const profile = await prisma.characterProfile.findUnique({ where: { personId } });
  const authored = profile?.enneagramType ?? null;
  const authoredSource = profile?.enneagramSource ?? null;

  const [fromProfile, fromFrags, fromRels] = await Promise.all([
    Promise.resolve(inferEnneagramFromProfile(profile)),
    inferEnneagramFromFragments(personId),
    inferEnneagramFromRelationships(personId),
  ]);

  const candidates = mergeCandidates([...fromProfile, ...fromFrags, ...fromRels]);

  const note =
    authored != null
      ? `Authored type ${authored} is law for this story unless you change it. Candidates below are advisory.`
      : `No authored Enneagram type — candidates are heuristic only. Choose deliberately when ready.`;

  return {
    personId,
    authoredType: authored,
    authoredSource,
    candidates,
    fromFragments: fromFrags,
    fromRelationships: fromRels,
    note,
  };
}

/** Optional: enrich blind spot / scene focus from engine for a candidate type (for UI hints). */
export function engineHintsForType(type: EnneagramType) {
  const p = getEnneagramProfile(type);
  return {
    likelySceneFocus: deriveLikelySceneFocus(type),
    likelyBlindSpot: deriveLikelyBlindSpot(type),
    label: p.label,
  };
}
