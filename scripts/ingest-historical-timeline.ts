/**
 * Historical timeline document — source + events + open questions + continuity notes.
 * Does not run extraction; safe to re-run (idempotent upserts by fixed ids).
 */
import "./load-env";
import {
  EventType,
  RecordType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

const SOURCE_ID = "source-historical-timeline-grappe-anchors";
const SOURCE_TITLE = "Historical Timeline – Grappe Narrative Anchors";

/** Seed chapter ids from `prisma/seed.ts` */
const CH = {
  prologue: "seed-ch-prologue",
  ch1: "seed-ch-1",
  ch2: "seed-ch-2",
} as const;

type EventSpec = {
  id: string;
  title: string;
  eventType: EventType;
  startYear?: number | null;
  endYear?: number | null;
  description?: string;
  /** Chapters that thematically anchor this anchor (seed chapters only). */
  chapterIds: string[];
};

const EVENT_SPECS: EventSpec[] = [
  {
    id: "timeline-ev-pre-colonial-natchitoches",
    title: "Pre-Colonial Natchitoches Life",
    eventType: EventType.CULTURAL,
    description: "Indigenous and colonial-era lifeways before the fort narrative.",
    chapterIds: [CH.prologue],
  },
  {
    id: "timeline-ev-fort-st-jean-baptiste-1714",
    title: "Establishment of Fort St. Jean Baptiste (1714)",
    eventType: EventType.POLITICAL,
    startYear: 1714,
    chapterIds: [CH.ch1],
  },
  {
    id: "timeline-ev-alexis-louise-marriage-1746",
    title: "Marriage of Alexis Grappe and Louise Guedon (1746)",
    eventType: EventType.MARRIAGE,
    startYear: 1746,
    chapterIds: [CH.ch1],
  },
  {
    id: "timeline-ev-francois-interpreter",
    title: "Rise of François Grappe as Interpreter",
    eventType: EventType.FAMILY,
    description: "Trade, languages, and mediation between communities.",
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-grappe-reservation",
    title: "Establishment of Grappe Reservation",
    eventType: EventType.LAND,
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-louisiana-purchase-1803",
    title: "Louisiana Purchase (1803)",
    eventType: EventType.POLITICAL,
    startYear: 1803,
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-campti-catholic-church",
    title: "Founding of Campti Catholic Church",
    eventType: EventType.CHURCH,
    chapterIds: [CH.ch1],
  },
  {
    id: "timeline-ev-civil-war-reconstruction",
    title: "Civil War and Reconstruction Impact",
    eventType: EventType.WAR,
    startYear: 1861,
    endYear: 1877,
    description: "Regional and family-level effects (broad span).",
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-jim-crow-campti",
    title: "Jim Crow Era in Campti",
    eventType: EventType.CULTURAL,
    description: "Local racial order and everyday life under segregation.",
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-buford-marshal",
    title: "Buford Grappe as Marshal",
    eventType: EventType.POLITICAL,
    description: "Law enforcement and community visibility in town memory.",
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-migration-arkansas",
    title: "Migration to Arkansas",
    eventType: EventType.MIGRATION,
    chapterIds: [CH.ch2],
  },
  {
    id: "timeline-ev-modern-rediscovery",
    title: "Modern Rediscovery of Grappe Lineage",
    eventType: EventType.CULTURAL,
    description: "Contemporary research, kinship, and narrative recovery.",
    chapterIds: [CH.prologue],
  },
];

const OPEN_QUESTIONS: { id: string; title: string }[] = [
  {
    id: "timeline-oq-oral-vs-documented",
    title: "What parts of this timeline are oral vs documented?",
  },
  {
    id: "timeline-oq-identity-legal-cultural",
    title: "Where does identity shift legally vs culturally?",
  },
  {
    id: "timeline-oq-lost-each-transition",
    title: "What was lost during each transition?",
  },
];

const CONTINUITY_NOTES: { id: string; title: string }[] = [
  { id: "timeline-cn-nonlinear", title: "Timeline is nonlinear" },
  { id: "timeline-cn-events-overlap-emotionally", title: "Events overlap emotionally" },
  { id: "timeline-cn-memory-distorts-sequence", title: "Memory may distort sequence" },
];

async function main() {
  await prisma.source.upsert({
    where: { id: SOURCE_ID },
    update: {
      title: SOURCE_TITLE,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      ingestionStatus: null,
      notes:
        "Historical timeline / narrative anchors. Do not run extraction; use for chronology and chapter linkage only.",
    },
    create: {
      id: SOURCE_ID,
      title: SOURCE_TITLE,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      notes:
        "Historical timeline / narrative anchors. Do not run extraction; use for chronology and chapter linkage only.",
    },
  });

  for (const e of EVENT_SPECS) {
    const trace = `Historical timeline anchor (${SOURCE_ID}).`;
    await prisma.event.upsert({
      where: { id: e.id },
      update: {
        title: e.title,
        description: e.description ?? null,
        eventType: e.eventType,
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        sourceTraceNote: trace,
        chapters: { set: e.chapterIds.map((id) => ({ id })) },
        sources: { connect: { id: SOURCE_ID } },
      },
      create: {
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        eventType: e.eventType,
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        sourceTraceNote: trace,
        chapters: { connect: e.chapterIds.map((id) => ({ id })) },
        sources: { connect: { id: SOURCE_ID } },
      },
    });
  }

  for (const q of OPEN_QUESTIONS) {
    await prisma.openQuestion.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        status: "open",
        linkedSourceId: SOURCE_ID,
        sourceTraceNote: `From historical timeline (${SOURCE_ID}).`,
      },
      create: {
        id: q.id,
        title: q.title,
        status: "open",
        linkedSourceId: SOURCE_ID,
        sourceTraceNote: `From historical timeline (${SOURCE_ID}).`,
      },
    });
  }

  for (const n of CONTINUITY_NOTES) {
    await prisma.continuityNote.upsert({
      where: { id: n.id },
      update: {
        title: n.title,
        severity: "high",
        status: "open",
        sourceTraceNote: `Global framing note from historical timeline (${SOURCE_ID}).`,
      },
      create: {
        id: n.id,
        title: n.title,
        severity: "high",
        status: "open",
        sourceTraceNote: `Global framing note from historical timeline (${SOURCE_ID}).`,
      },
    });
  }

  console.log("Done:", {
    sourceId: SOURCE_ID,
    events: EVENT_SPECS.length,
    openQuestions: OPEN_QUESTIONS.length,
    continuityNotes: CONTINUITY_NOTES.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
