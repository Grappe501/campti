type OutlineTheme = "power" | "identity" | "faith" | "survival";

import { isEarlyChapterRange } from "@/lib/services/book1-lineage-conduit-service";

export type Book1OutlineKnowledgeNode = {
  nodeType: string;
  title: string;
  canonicalStatement: string;
  summaryShort: string | null;
  summaryLong: string | null;
  historicalScope: string | null;
  narrativeScope: string | null;
};

export type Book1OutlineTimelineEvent = {
  title: string;
  eventType: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  yearLabel: string | null;
  description: string | null;
  historicalOrStory: string;
};

export type Book1OutlineEntity = {
  id?: string;
  displayName: string;
  entityType: string;
  description: string | null;
  startYear: number | null;
  endYear: number | null;
  notes: string | null;
  lineageLinked?: boolean;
  ancestral_priority?: number;
  direct_lineage_conduit?: boolean;
  chronology_protection?: boolean;
  future_descendant_links?: string[];
};

export type Book1OutlineSceneAnchor = {
  sceneNumber: number;
  sceneKey: string;
  title: string;
  eraLabel: string | null;
  functionInBook: string | null;
  summary: string | null;
};

export type Book1OutlinePsychProfile = {
  name: string;
  enneagramType: string | null;
  coreFear: string | null;
  coreDesire: string | null;
};

export type Book1EpicOutline = {
  generatedAt: string;
  thematicVision: OutlineTheme[];
  phases: Array<
    | {
        name: "Pre-Civil War";
        timeRange: string;
        chapters: Array<{
          chapter: number;
          timePeriod: string;
          keyEvents: string[];
          characters: string[];
          psychologicalForces: string[];
          themes: OutlineTheme[];
          readerExperience: string;
          connectedScenes: number[];
        }>;
      }
    | {
        name: "Post-Civil War";
        timeRange: string;
        chapters: Array<{
          chapter: number;
          timePeriod: string;
          broadArc: string;
          keyCharacters: string[];
        }>;
      }
  >;
};

const DEFAULT_THEMES: OutlineTheme[] = ["power", "identity", "faith", "survival"];
const CIVIL_WAR_START = 1861;
const CIVIL_WAR_END = 1865;
const CHARACTER_STOPLIST = new Set([
  "across",
  "active",
  "age",
  "adoption",
  "after",
  "all",
  "alliance",
  "alliances",
  "also",
  "america",
  "analysis",
  "aunt",
  "appendix",
  "arrival",
  "before",
  "birth",
  "book",
  "because",
  "background",
  "behind",
  "between",
  "boundary",
  "born",
  "chapter",
  "context",
  "culture",
  "during",
  "early",
  "event",
  "first",
  "group",
  "history",
  "identity",
  "index",
  "introduction",
  "later",
  "lineage",
  "narrative",
  "note",
  "notes",
  "overview",
  "period",
  "people",
  "power",
  "ritual",
  "second",
  "section",
  "source",
  "society",
  "structure",
  "systems",
  "third",
  "summary",
  "survival",
  "system",
  "theme",
  "title",
  "alive",
]);
const GROUP_ENTITY_TYPES = new Set(["TRIBE", "SETTLEMENT", "INSTITUTION"]);
const GROUP_ALLOWLIST_HINTS = [
  /\bapproved\b.{0,24}\b(group|community|cast|character|entity)\b/i,
  /\ballow(?:ed)?\b.{0,24}\b(group|community|cast|character|entity)\b/i,
  /\bcommunity voice approved\b/i,
  /\bcharacter roster approved\b/i,
];

type TimelineEventWithYear = Book1OutlineTimelineEvent & { inferredYear: number | null };

const DETAILED_CHAPTER_BLUEPRINTS = [
  { label: "Pre-contact lifeways and ritual order", range: "Before 1680", keywords: ["pre-contact", "village", "river", "ritual", "kinship"], sceneHintMax: 2 },
  { label: "Early pressure signs and regional movement", range: "1680-1690", keywords: ["pressure", "route", "migration", "encounter"], sceneHintMax: 3 },
  { label: "French arrival horizon and first asymmetries", range: "1690-1714", keywords: ["french", "arrival", "tonti", "st denis", "contact"], sceneHintMax: 4 },
  { label: "Trade protocols become political leverage", range: "1714-1735", keywords: ["trade", "exchange", "post", "alliance"], sceneHintMax: 5 },
  { label: "Settlement pressure and land negotiation", range: "1735-1765", keywords: ["settlement", "land", "boundary", "mission"], sceneHintMax: 6 },
  { label: "Lineage memory hardens social law", range: "1765-1790", keywords: ["lineage", "family", "matrilineal", "inherit"], sceneHintMax: 7 },
  { label: "Cross-cultural mediation and unstable truce", range: "1790-1810", keywords: ["mediation", "conflict", "tribe", "council"], sceneHintMax: 8 },
  { label: "Institutional tightening and survival strategy", range: "1810-1830", keywords: ["institution", "governance", "law", "system"], sceneHintMax: 9 },
  { label: "Succession stress and identity fracture", range: "1830-1845", keywords: ["succession", "identity", "role", "household"], sceneHintMax: 10 },
  { label: "Spiritual tests and community convergence", range: "1845-1855", keywords: ["faith", "ritual", "death", "ceremony"], sceneHintMax: 11 },
  { label: "Borderlands militarization and fear economy", range: "1855-1860", keywords: ["military", "border", "violence", "power"], sceneHintMax: 12 },
  { label: "Threshold to Civil War and unresolved vows", range: "1860-1865", keywords: ["civil war", "threshold", "separation", "inheritance"], sceneHintMax: 13 },
] as const;

const BROAD_CHAPTER_BLUEPRINTS = [
  { label: "Civil War rupture reframes survival contracts", range: "1861-1865" },
  { label: "Reconstruction remaps authority and identity", range: "1865-1890" },
  { label: "Industrial and legal modernity compresses memory", range: "1890-1945" },
  { label: "Late-modern fragmentation and archive recovery", range: "1945-2000" },
  { label: "Narrator convergence reconciles faith, lineage, and future", range: "2000-present" },
] as const;

function inferYear(event: Book1OutlineTimelineEvent): number | null {
  if (event.dateStart) return event.dateStart.getUTCFullYear();
  const text = `${event.yearLabel ?? ""} ${event.description ?? ""} ${event.title}`;
  const match = text.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function includesAny(text: string, keywords: readonly string[]): boolean {
  const value = text.toLowerCase();
  return keywords.some((keyword) => value.includes(keyword));
}

function compact(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function isLexicalJunkName(value: string): boolean {
  const normalized = normalizeToken(value);
  if (!normalized) return true;
  if (/\bmatriarch\b/.test(normalized)) return false;
  const words = normalized.split(" ").filter(Boolean);
  const single = words[0] ?? "";
  if (words.length === 1 && CHARACTER_STOPLIST.has(words[0])) return true;
  if (words.every((word) => CHARACTER_STOPLIST.has(word))) return true;
  if (words.length <= 2 && words.some((word) => CHARACTER_STOPLIST.has(word))) return true;
  if (words.length === 1 && /(?:tion|ment|ness|ship|ance|ence|ity|ive|ward|wise)$/.test(single)) return true;
  if (words.length === 1 && /s$/.test(single) && !/(?:is|us|as|os|ys|ss)$/.test(single)) return true;
  return false;
}

function hasExplicitGroupApproval(entity: Book1OutlineEntity): boolean {
  const descriptor = `${entity.notes ?? ""} ${entity.description ?? ""}`;
  return GROUP_ALLOWLIST_HINTS.some((pattern) => pattern.test(descriptor));
}

function isCharacterEligible(entity: Book1OutlineEntity): boolean {
  if (entity.entityType === "PERSON") return !isLexicalJunkName(entity.displayName);
  if (!GROUP_ENTITY_TYPES.has(entity.entityType)) return false;
  if (!hasExplicitGroupApproval(entity)) return false;
  return !isLexicalJunkName(entity.displayName);
}

export function filterOutlineCharacterEntities(entities: Book1OutlineEntity[]): Book1OutlineEntity[] {
  return entities.filter((entity) => isCharacterEligible(entity));
}

function topUnique(values: string[], max: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = compact(value);
    if (!normalized || seen.has(normalized)) continue;
    out.push(normalized);
    seen.add(normalized);
    if (out.length >= max) break;
  }
  return out;
}

function parseRangeYears(range: string): { start: number | null; end: number | null } {
  const beforeMatch = range.match(/before\s+(\d{4})/i);
  if (beforeMatch) return { start: null, end: Number.parseInt(beforeMatch[1], 10) - 1 };
  const span = range.match(/(\d{4})\s*-\s*(\d{4})/);
  if (span) return { start: Number.parseInt(span[1], 10), end: Number.parseInt(span[2], 10) };
  return { start: null, end: null };
}

function filterEventsForRange(events: TimelineEventWithYear[], range: string, keywords: readonly string[]): TimelineEventWithYear[] {
  const years = parseRangeYears(range);
  const byTime = events.filter((event) => {
    if (event.inferredYear === null) return false;
    if (years.start !== null && event.inferredYear < years.start) return false;
    if (years.end !== null && event.inferredYear > years.end) return false;
    return true;
  });
  if (byTime.length > 0) return byTime;
  return events.filter((event) => includesAny(`${event.title} ${event.description ?? ""}`, keywords));
}

function guessCharactersForChapter(
  entities: Book1OutlineEntity[],
  events: TimelineEventWithYear[],
  nodes: Book1OutlineKnowledgeNode[],
  chapterRange: string,
): string[] {
  const earlyChapter = isEarlyChapterRange(chapterRange);
  const pool = filterOutlineCharacterEntities(entities);
  const gatedPool = pool.filter((entity) => {
    const looksDescendant =
      !entity.direct_lineage_conduit && /alexis|buford|fran[cç]ois|coincoin/i.test(entity.displayName);
    if (!earlyChapter) return true;
    return !looksDescendant;
  });
  const chapterText = `${events.map((row) => `${row.title} ${row.description ?? ""}`).join(" ")} ${nodes
    .map((node) => `${node.title} ${node.canonicalStatement} ${node.summaryShort ?? ""}`)
    .join(" ")}`.toLowerCase();
  const ranked = gatedPool
    .map((entity) => {
      const name = entity.displayName.toLowerCase();
      let score = chapterText.includes(name) ? 3 : 0;
      if (entity.entityType === "PERSON") score += 2;
      if (entity.lineageLinked) score += 1;
      if ((entity.ancestral_priority ?? 0) > 0) score += 5;
      if (entity.direct_lineage_conduit) score += 4;
      if (entity.chronology_protection) score += 2;
      if (GROUP_ENTITY_TYPES.has(entity.entityType)) score += 1;
      if (entity.description && includesAny(entity.description, ["leader", "mother", "father", "interpreter", "mediator"])) {
        score += 1;
      }
      return { name: entity.displayName, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return topUnique(ranked.map((row) => row.name), 5);
}

function psychologicalForcesForCharacters(characters: string[], profiles: Book1OutlinePsychProfile[]): string[] {
  const lines = characters.map((character) => {
    const profile = profiles.find((row) => row.name.toLowerCase() === character.toLowerCase());
    if (!profile) return `${character}: duty vs belonging under inherited pressure`;
    const enneagram = profile.enneagramType ? `type ${profile.enneagramType}` : "untyped";
    const fear = profile.coreFear ? `fear=${profile.coreFear}` : "fear=loss of place";
    const desire = profile.coreDesire ? `desire=${profile.coreDesire}` : "desire=continuity and dignity";
    return `${character}: ${enneagram}; ${fear}; ${desire}`;
  });
  return topUnique(lines, 4);
}

function scenesForPhase(anchors: Book1OutlineSceneAnchor[]): { preCivil: number[]; postCivil: number[] } {
  const canonical = anchors.filter((anchor) => anchor.sceneNumber >= 1 && anchor.sceneNumber <= 17).sort((a, b) => a.sceneNumber - b.sceneNumber);
  const preCivil = canonical.filter((anchor) => anchor.sceneNumber <= 13).map((anchor) => anchor.sceneNumber);
  const postCivil = canonical.filter((anchor) => anchor.sceneNumber >= 14).map((anchor) => anchor.sceneNumber);
  return {
    preCivil: preCivil.length > 0 ? preCivil : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    postCivil: postCivil.length > 0 ? postCivil : [14, 15, 16, 17],
  };
}

export class Book1EpicOutlineBuilder {
  build(input: {
    knowledgeNodes: Book1OutlineKnowledgeNode[];
    timelineEvents: Book1OutlineTimelineEvent[];
    entities: Book1OutlineEntity[];
    sceneAnchors: Book1OutlineSceneAnchor[];
    enneagramProfiles?: Book1OutlinePsychProfile[];
    thematicVision?: OutlineTheme[];
  }): Book1EpicOutline {
    const thematicVision = input.thematicVision && input.thematicVision.length > 0 ? input.thematicVision : DEFAULT_THEMES;
    const profiles = input.enneagramProfiles ?? [];
    const events = input.timelineEvents
      .map((event) => ({ ...event, inferredYear: inferYear(event) }))
      .sort((a, b) => (a.inferredYear ?? Number.MAX_SAFE_INTEGER) - (b.inferredYear ?? Number.MAX_SAFE_INTEGER));
    const preCivilEvents = events.filter((event) => event.inferredYear === null || event.inferredYear <= CIVIL_WAR_END);
    const postCivilEvents = events.filter((event) => event.inferredYear !== null && event.inferredYear >= CIVIL_WAR_START);
    const phaseScenes = scenesForPhase(input.sceneAnchors);
    const detailedChapters = DETAILED_CHAPTER_BLUEPRINTS.map((beat, index) => {
      const chapterEvents = filterEventsForRange(preCivilEvents, beat.range, beat.keywords);
      const chapterNodes = input.knowledgeNodes.filter((node) =>
        includesAny(`${node.title} ${node.canonicalStatement} ${node.summaryShort ?? ""}`, beat.keywords),
      );
      const keyEvents = topUnique(chapterEvents.map((event) => `${event.title}${event.inferredYear ? ` (${event.inferredYear})` : ""}`), 4);
      const characters = guessCharactersForChapter(input.entities, chapterEvents, chapterNodes, beat.range);
      const psychologicalForces = psychologicalForcesForCharacters(characters, profiles);
      const connectedScene = phaseScenes.preCivil[Math.min(index, phaseScenes.preCivil.length - 1)];
      const fallbackCharacters = topUnique(filterOutlineCharacterEntities(input.entities).map((entity) => entity.displayName), 4);
      return {
        chapter: index + 1,
        timePeriod: beat.range,
        keyEvents: keyEvents.length > 0 ? keyEvents : topUnique(chapterNodes.map((node) => node.title), 4),
        characters: characters.length > 0 ? characters : fallbackCharacters,
        psychologicalForces:
          psychologicalForces.length > 0 ? psychologicalForces : ["Collective fear of displacement competes with inherited obligations."],
        themes: thematicVision,
        readerExperience: `${beat.label}: grounded history with escalating emotional stakes and foreshadowed lineage consequences.`,
        connectedScenes: connectedScene ? [connectedScene] : [],
      };
    });

    const broadBaseChapter = detailedChapters.length + 1;
    const broadChapters = BROAD_CHAPTER_BLUEPRINTS.map((beat, index) => {
      const eventsForBeat = filterEventsForRange(postCivilEvents, beat.range, [beat.label.toLowerCase()]);
      const keyCharacters = topUnique(
        guessCharactersForChapter(input.entities, eventsForBeat, input.knowledgeNodes, beat.range).concat(
          topUnique(filterOutlineCharacterEntities(input.entities).map((entity) => entity.displayName), 4),
        ),
        5,
      );
      const eventsSummary = topUnique(eventsForBeat.map((event) => event.title), 3).join("; ");
      return {
        chapter: broadBaseChapter + index,
        timePeriod: beat.range,
        broadArc: eventsSummary ? `${beat.label}. Anchors: ${eventsSummary}.` : `${beat.label}.`,
        keyCharacters,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      thematicVision,
      phases: [
        {
          name: "Pre-Civil War",
          timeRange: "Pre-contact to 1865",
          chapters: detailedChapters,
        },
        {
          name: "Post-Civil War",
          timeRange: "1865 to present-day narrator convergence",
          chapters: broadChapters,
        },
      ],
    };
  }
}
