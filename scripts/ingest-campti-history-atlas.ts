/**
 * Campti history atlas — one searchable Source + Event nodes tied to Place (Campti) for cross-reference.
 * Complements `scripts/ingest-historical-timeline.ts` (Grappe anchors). Idempotent.
 *
 *   npx tsx scripts/ingest-campti-history-atlas.ts
 */
import "./load-env";
import {
  EventType,
  RecordType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import {
  CAMPTI_ATLAS_EVENT_IDS,
  CAMPTI_CENSUS_DATASET_ID,
  CAMPTI_HISTORY_ATLAS_SOURCE_ID,
  CAMPTI_SEED_PLACE_ID,
} from "../lib/campti-history-atlas-constants";
import { prisma } from "../lib/prisma";

const SOURCE_TITLE = "Campti History Atlas — parish/town cross-reference";

const CH = {
  prologue: "seed-ch-prologue",
  ch1: "seed-ch-1",
  ch2: "seed-ch-2",
} as const;

const ALL_CHAPTERS = [CH.prologue, CH.ch1, CH.ch2];

const ATLAS_MARKDOWN = `# Campti History Atlas

Cross-reference spine for Natchitoches Parish / Red River corridor. **Place:** Campti (seed-place-campti). **Census OCR dataset:** ${CAMPTI_CENSUS_DATASET_ID}. **World-state era tags** (simulation): WS-01 sacred trade, WS-04 cotton expansion, WS-06 Jim Crow rural, WS-07 engineered waterway, WS-08 modern decline/memory, WS-09 Red River trade framing.

## Population & demographics
- Colonial habitant lists differ from U.S. census place counts. Town-level U.S. figures often cited: ~101 (1880) rising to ~1k mid-20th c.; **887 (2020)**. Use data.census.gov for official tables.
- Demographic majority African American reflects plantation labor and rural Black community continuity.

## Schools & employment
- Public schools: **Natchitoches Parish School Board** — Fairview-Alpha (PK–6), Lakeview Jr/Sr High (7–12) in Campti area. Title I / high economic disadvantage in public data.
- Employment: historical agriculture and forestry; **International Paper** Red River mill was major employer until **2025 closure** (regional press); possible site reuse reported later 2025.

## History & economics
- Red River geography; **Great Raft** cleared (Shreve) shifted trade; **Shreveport** grew upstream; Campti remained a **small river town**.
- Antebellum: cotton / enslaved labor; postwar: tenancy, cattle, timber, mills.

## Native American integration & continuity
- Caddoan trade networks; French posts (e.g. St. Denis era). Name **Campti** from Native leader (“Roi de Campti”) in local tradition.
- **Natchitoches Tribe of Louisiana** — state-recognized; headquarters associated with **Campti** per tribal materials. Not interchangeable with “assimilation” narratives.

## Jim Crow & civil rights
- Louisiana **1898 constitution** and Jim Crow order; segregated schools until **Brown** (1954) and long implementation struggle statewide. Parish-specific court records for Campti require archives.
- Federal desegregation oversight patterns in Louisiana parishes (recent consent-decree news is statewide context).

## Civil War
- **Red River Campaign (1864)**; Campti burned **April 1864** (Union forces in regional campaign); church sometimes said spared — verify in primary accounts.
- Free people of color: complex military and labor histories; cite primary sources for characters.

## How to find this in the app
- **Events:** ids prefixed \`campti-atlas-ev-*\` + linked \`timeline-ev-*\` Campti anchors.
- **Source:** \`${CAMPTI_HISTORY_ATLAS_SOURCE_ID}\` (this document + chunks).
- **Structured census:** Postgres \`CensusResearch*\` + \`npm run research:census-pipeline\`.
`;

type Ev = {
  id: string;
  title: string;
  eventType: EventType;
  startYear?: number | null;
  endYear?: number | null;
  description?: string;
};

const EVENTS: Ev[] = [
  {
    id: CAMPTI_ATLAS_EVENT_IDS.caddoTrade,
    title: "Caddoan trade geometry — Red River corridor (pre-colonial)",
    eventType: EventType.CULTURAL,
    description:
      "Trade networks across ArkLaTex; salt, agricultural exchange. Era lens: WS-01, WS-09.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.frenchPosts,
    title: "French & Spanish Red River posts (18th c.)",
    eventType: EventType.POLITICAL,
    startYear: 1700,
    endYear: 1803,
    description: "Imperial trade and settlement layer before U.S. territorial period. WS-01 / WS-04 antecedent.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.nameCampti,
    title: "Campti place-name — chief / missionary record tradition",
    eventType: EventType.CULTURAL,
    startYear: 1745,
    description:
      "Local tradition ties name to Native leader; 1745 missionary visit cited in promotional/history material. Verify in primary sources.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.greatRaft,
    title: "Great Raft & Shreve clearing — navigation shift",
    eventType: EventType.LAND,
    startYear: 1830,
    endYear: 1840,
    description:
      "Logjam removal redirected growth; Shreveport rises; Campti stays river-rural. WS-07.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.antebellum,
    title: "Antebellum plantation labor — Natchitoches Parish",
    eventType: EventType.LAND,
    startYear: 1820,
    endYear: 1860,
    description: "Cotton economy; enslaved labor. WS-04.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.freePeopleColor,
    title: "Free people of color — complex status antebellum",
    eventType: EventType.CULTURAL,
    startYear: 1830,
    endYear: 1861,
    description:
      "Regional historiography emphasizes nuanced status; do not flatten. WS-04.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.burning1864,
    title: "1864 — Campti burned (Red River Campaign)",
    eventType: EventType.WAR,
    startYear: 1864,
    description: "April 1864; Union forces in regional campaign. Church survival is tradition—verify.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.demographics,
    title: "Campti population arc — census aggregates (1880–2020)",
    eventType: EventType.CULTURAL,
    startYear: 1880,
    endYear: 2020,
    description:
      "Town place-level counts rise to ~1k then decline to 887 (2020). Cross-check census.gov.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.jimCrowState,
    title: "Jim Crow Louisiana — constitutional disenfranchisement & segregation",
    eventType: EventType.POLITICAL,
    startYear: 1898,
    endYear: 1965,
    description: "1898 constitution; separate schools; VRA 1965 later. WS-06.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.schools,
    title: "Modern Campti-area public schools (NPSB)",
    eventType: EventType.CULTURAL,
    startYear: 1950,
    description: "Fairview-Alpha; Lakeview Jr/Sr High. Desegregation history is statewide + parish archives.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.economyForest,
    title: "Forest products & rural employment (20th–21st c.)",
    eventType: EventType.LAND,
    startYear: 1900,
    description: "Timber/paper; parish forest economy ties. WS-08.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.mill2025,
    title: "2025 — International Paper Campti mill closure (regional shock)",
    eventType: EventType.CULTURAL,
    startYear: 2025,
    description:
      "Major job loss reported in regional news; possible reuse — confirm current status. WS-08.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.tribalHq,
    title: "Natchitoches Tribe of Louisiana — Campti headquarters (contemporary)",
    eventType: EventType.CULTURAL,
    description: "State-recognized tribe; HQ Campti per tribal public materials.",
  },
  {
    id: CAMPTI_ATLAS_EVENT_IDS.civilRights,
    title: "Civil rights era — desegregation & ongoing equity",
    eventType: EventType.POLITICAL,
    startYear: 1954,
    endYear: 1980,
    description: "Brown; parish implementation; federal oversight patterns in LA. WS-06 → post-1965.",
  },
];

const TIMELINE_LINK_IDS = [
  "timeline-ev-campti-catholic-church",
  "timeline-ev-civil-war-reconstruction",
  "timeline-ev-jim-crow-campti",
] as const;

const OPEN_QUESTIONS = [
  {
    id: "campti-atlas-oq-primary-vs-story",
    title: "Which Campti beats are documented vs family/oral tradition?",
  },
  {
    id: "campti-atlas-oq-parish-vs-town",
    title: "Where does Natchitoches Parish data substitute for Campti town facts?",
  },
] as const;

function chunkText(text: string, target = 3800): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts: string[] = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(start + target, t.length);
    if (end < t.length) {
      const slice = t.slice(start, end);
      const br = slice.lastIndexOf("\n\n");
      if (br > target * 0.2) end = start + br;
    }
    const piece = t.slice(start, end).trim();
    if (piece) parts.push(piece);
    start = end;
  }
  return parts;
}

async function main() {
  const trace = `Campti history atlas (${CAMPTI_HISTORY_ATLAS_SOURCE_ID}). Cross-ref: place ${CAMPTI_SEED_PLACE_ID}, census ${CAMPTI_CENSUS_DATASET_ID}.`;

  await prisma.source.upsert({
    where: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID },
    update: {
      title: SOURCE_TITLE,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HISTORICAL,
      sourceType: SourceType.NOTE,
      ingestionReady: true,
      summary:
        "Parish/town chronology spine: demographics, schools, economy, Native continuity, Jim Crow, civil rights, Civil War. Searchable chunks + Event graph.",
      processingNotes: trace,
      notes: `Structured census rows: dataset ${CAMPTI_CENSUS_DATASET_ID}. Run npm run research:census-pipeline to refresh OCR DB.`,
    },
    create: {
      id: CAMPTI_HISTORY_ATLAS_SOURCE_ID,
      title: SOURCE_TITLE,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HISTORICAL,
      sourceType: SourceType.NOTE,
      ingestionReady: true,
      summary:
        "Parish/town chronology spine: demographics, schools, economy, Native continuity, Jim Crow, civil rights, Civil War. Searchable chunks + Event graph.",
      processingNotes: trace,
      notes: `Structured census: ${CAMPTI_CENSUS_DATASET_ID}.`,
    },
  });

  const textRow = await prisma.sourceText.upsert({
    where: { sourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID },
    update: {
      rawText: ATLAS_MARKDOWN,
      normalizedText: ATLAS_MARKDOWN,
      textStatus: "atlas",
      textNotes: trace,
    },
    create: {
      sourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID,
      rawText: ATLAS_MARKDOWN,
      normalizedText: ATLAS_MARKDOWN,
      textStatus: "atlas",
      textNotes: trace,
    },
  });

  await prisma.sourceChunk.deleteMany({
    where: { sourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID },
  });
  const parts = chunkText(ATLAS_MARKDOWN);
  for (let i = 0; i < parts.length; i++) {
    await prisma.sourceChunk.create({
      data: {
        sourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID,
        sourceTextId: textRow.id,
        chunkIndex: i,
        charCount: parts[i].length,
        rawText: parts[i],
        normalizedText: parts[i],
        textStatus: "atlas",
        chunkLabel: `atlas ${i + 1}/${parts.length}`,
      },
    });
  }

  for (const e of EVENTS) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: {
        title: e.title,
        description: e.description ?? null,
        eventType: e.eventType,
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
        visibility: VisibilityStatus.PUBLIC,
        recordType: RecordType.HISTORICAL,
        sourceTraceNote: trace,
        sources: { connect: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID } },
        places: { connect: { id: CAMPTI_SEED_PLACE_ID } },
        chapters: { set: ALL_CHAPTERS.map((id) => ({ id })) },
      },
      create: {
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        eventType: e.eventType,
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
        visibility: VisibilityStatus.PUBLIC,
        recordType: RecordType.HISTORICAL,
        sourceTraceNote: trace,
        sources: { connect: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID } },
        places: { connect: { id: CAMPTI_SEED_PLACE_ID } },
        chapters: { connect: ALL_CHAPTERS.map((id) => ({ id })) },
      },
    });
  }

  for (const tid of TIMELINE_LINK_IDS) {
    const ex = await prisma.event.findUnique({ where: { id: tid } });
    if (!ex) continue;
    await prisma.event.update({
      where: { id: tid },
      data: {
        sources: { connect: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID } },
        places: { connect: { id: CAMPTI_SEED_PLACE_ID } },
      },
    });
  }

  for (const q of OPEN_QUESTIONS) {
    await prisma.openQuestion.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        status: "open",
        linkedSourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID,
        linkedPlaceId: CAMPTI_SEED_PLACE_ID,
        sourceTraceNote: trace,
      },
      create: {
        id: q.id,
        title: q.title,
        status: "open",
        linkedSourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID,
        linkedPlaceId: CAMPTI_SEED_PLACE_ID,
        sourceTraceNote: trace,
      },
    });
  }

  console.log("Campti history atlas ingested:", {
    sourceId: CAMPTI_HISTORY_ATLAS_SOURCE_ID,
    chunks: parts.length,
    events: EVENTS.length,
    timelineLinksAttempted: TIMELINE_LINK_IDS.length,
    openQuestions: OPEN_QUESTIONS.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
