import {
  FragmentType,
  PlaceType,
  RecordType,
  SourceType,
  SymbolCategory,
  VisibilityStatus,
} from "@prisma/client";
import { FRAGMENT_DECOMPOSITION_VERSION } from "../lib/fragment-constants";
import {
  buildPromptVersionLabel,
  INSTRUCTIONS_VERSION,
} from "../lib/ingestion-constants";
import { prisma } from "../lib/prisma";
import { seedOriginWorldAnchor } from "./seed-origin-anchor";
import { seedOpeningTerrainChapterOnePass } from "./seed-opening-terrain-pass";
import { seedFullDemo } from "./seed-full-demo";
import { seedConstitutionalRules } from "./seed-constitutional-rules";
import { seedOntology } from "./seed-ontology";
import { seedCharacterEngineSample } from "./seed-character-engine";
import { seedEnvironment } from "./seed-environment";
import { seedPressure } from "./seed-pressure";

async function main() {
  const people = [
    { id: "seed-person-alexis", name: "Alexis Grappe" },
    { id: "seed-person-francois", name: "François Grappe" },
    { id: "seed-person-buford", name: 'Buford "Trixie" Grappe' },
    { id: "seed-person-narrator", name: "Narrator" },
  ];

  for (const p of people) {
    await prisma.person.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        visibility: VisibilityStatus.PUBLIC,
        recordType: RecordType.HYBRID,
      },
    });
  }

  const places: { id: string; name: string; placeType: PlaceType }[] = [
    { id: "seed-place-campti", name: "Campti", placeType: PlaceType.TOWN },
    { id: "seed-place-natchitoches", name: "Natchitoches", placeType: PlaceType.TOWN },
    { id: "seed-place-black-lake", name: "Black Lake", placeType: PlaceType.LAKE },
  ];

  for (const pl of places) {
    await prisma.place.upsert({
      where: { id: pl.id },
      update: {},
      create: {
        id: pl.id,
        name: pl.name,
        placeType: pl.placeType,
        visibility: VisibilityStatus.PUBLIC,
        recordType: RecordType.HISTORICAL,
      },
    });
  }

  const symbols: { id: string; name: string; meaning: string; category: SymbolCategory }[] = [
    { id: "seed-symbol-smoke", name: "Smoke", meaning: "Signal and memory", category: SymbolCategory.ELEMENTAL },
    { id: "seed-symbol-flame", name: "Flame", meaning: "Persistence", category: SymbolCategory.ELEMENTAL },
    { id: "seed-symbol-sassafras", name: "Sassafras", meaning: "Rooted place", category: SymbolCategory.LANDSCAPE },
    { id: "seed-symbol-roux", name: "Roux", meaning: "Foundation", category: SymbolCategory.CULINARY },
    { id: "seed-symbol-okra", name: "Okra", meaning: "Thickening ties", category: SymbolCategory.CULINARY },
  ];

  for (const s of symbols) {
    await prisma.symbol.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        meaning: s.meaning,
        category: s.category,
        visibility: VisibilityStatus.PUBLIC,
        recordType: RecordType.FICTIONAL,
      },
    });
  }

  const chPrologue = await prisma.chapter.upsert({
    where: { id: "seed-ch-prologue" },
    update: {},
    create: {
      id: "seed-ch-prologue",
      title: "Prologue",
      chapterNumber: 0,
      summary: "The story begins before the road, in smoke and memory.",
      publicNotes: "A reader-safe note: the prologue frames the novel’s oral and documentary strands.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.FICTIONAL,
      status: "drafting",
    },
  });

  const ch1 = await prisma.chapter.upsert({
    where: { id: "seed-ch-1" },
    update: {},
    create: {
      id: "seed-ch-1",
      title: "Chapter 1: Alexis – Arrival in Natchitoches",
      chapterNumber: 1,
      summary: "Alexis arrives in Natchitoches; the town and its histories press into view.",
      publicNotes: "Public teaser for Alexis’s first chapter.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.FICTIONAL,
      status: "drafting",
    },
  });

  const ch2 = await prisma.chapter.upsert({
    where: { id: "seed-ch-2" },
    update: {},
    create: {
      id: "seed-ch-2",
      title: "Chapter 2: François – The Trader, the Interpreter, the Bridge",
      chapterNumber: 2,
      summary: "François moves between worlds, trade, and translation.",
      publicNotes: "François’s public-facing chapter note.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      status: "planned",
    },
  });

  await prisma.scene.upsert({
    where: { id: "seed-scene-prologue-1" },
    update: {},
    create: {
      id: "seed-scene-prologue-1",
      chapterId: chPrologue.id,
      description: "Prologue — opening image",
      summary: "Smoke on the water; the past announced before speech.",
      orderInChapter: 1,
      sceneNumber: 1,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
    },
  });

  await prisma.scene.upsert({
    where: { id: "seed-scene-ch1-1" },
    update: {},
    create: {
      id: "seed-scene-ch1-1",
      chapterId: ch1.id,
      description: "Alexis — first sight of Natchitoches",
      summary: "River, road, and the weight of arrival.",
      orderInChapter: 1,
      sceneNumber: 1,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
    },
  });

  await prisma.scene.upsert({
    where: { id: "seed-scene-ch2-1" },
    update: {},
    create: {
      id: "seed-scene-ch2-1",
      chapterId: ch2.id,
      description: "François — the trader’s table",
      summary: "Goods, languages, and the politics of interpretation.",
      orderInChapter: 1,
      sceneNumber: 1,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
    },
  });

  await prisma.openQuestion.upsert({
    where: { id: "seed-oq-francois-doc" },
    update: {},
    create: {
      id: "seed-oq-francois-doc",
      title: "Was François Grappe Jr. formally documented in surviving records?",
      description: "Track parish, federal, and tribal records; note gaps explicitly.",
      status: "open",
      priority: 2,
      linkedPersonId: "seed-person-francois",
    },
  });

  await prisma.openQuestion.upsert({
    where: { id: "seed-oq-grappe-treaty" },
    update: {},
    create: {
      id: "seed-oq-grappe-treaty",
      title: "What is the strongest evidence trail for the Grappe Reservation treaty?",
      description: "Map citations and oral history against documentary fragments.",
      status: "researching",
      priority: 1,
    },
  });

  await prisma.openQuestion.upsert({
    where: { id: "seed-oq-graveyard-line" },
    update: {},
    create: {
      id: "seed-oq-graveyard-line",
      title: "How should the graveyard racial dividing line be represented in narrative vs documentation?",
      description: "Resolve ethics of depiction; avoid flattening violence into metaphor.",
      status: "open",
      priority: 3,
      linkedPlaceId: "seed-place-campti",
    },
  });

  await prisma.continuityNote.upsert({
    where: { id: "seed-cn-narrator-reveal" },
    update: {},
    create: {
      id: "seed-cn-narrator-reveal",
      title: "Narrator reveal must remain hidden until final chapter",
      description: "Structure scenes so identity clues are reversible until the close.",
      severity: "high",
      status: "open",
      linkedChapterId: chPrologue.id,
    },
  });

  await prisma.continuityNote.upsert({
    where: { id: "seed-cn-oral-label" },
    update: {},
    create: {
      id: "seed-cn-oral-label",
      title: "Do not collapse oral history into verified fact without labeling",
      description: "Use chapter notes and claim types to keep hybridity visible.",
      severity: "medium",
      status: "open",
    },
  });

  await prisma.continuityNote.upsert({
    where: { id: "seed-cn-buford-accidents" },
    update: {},
    create: {
      id: "seed-cn-buford-accidents",
      title: "Track whether Buford’s accidents are documented, oral, or hybrid",
      description: "Align Buford’s arc with record types and claims.",
      severity: "low",
      status: "open",
      linkedPersonId: "seed-person-buford",
    },
  });

  const seedSourceId = "seed-source-grappe-legacy";
  await prisma.source.upsert({
    where: { id: seedSourceId },
    update: {},
    create: {
      id: seedSourceId,
      title: "Grappe Legacy: A Comprehensive Guide",
      summary:
        "Compiled family notes, land references, and narrative hooks for the Campti–Natchitoches corridor.",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.PDF,
      archiveStatus: "reviewed",
      ingestionStatus: "reviewing",
      sourceYear: 2026,
      authorOrOrigin: "Family archive",
      ingestionReady: true,
      extractedSummary:
        "Mock pipeline: Alexis and Campti recur; Buford hunting-accident claim flagged for verification.",
    },
  });

  await prisma.sourceText.upsert({
    where: { sourceId: seedSourceId },
    update: {},
    create: {
      sourceId: seedSourceId,
      rawText:
        "Excerpt — The Grappe name threads through Campti and Black Lake. Alexis carried letters north; smoke from winter fields marked gatherings. Oral accounts describe Buford Grappe losing his arm in a hunting accident; treat as hybrid until parish records confirm.",
      normalizedText: null,
      textStatus: "imported",
      textNotes: "Seeded excerpt for ingestion UI testing.",
    },
  });

  const seedRunId = "seed-ingestion-run-grappe-1";
  await prisma.ingestionRun.upsert({
    where: { id: seedRunId },
    update: {},
    create: {
      id: seedRunId,
      sourceId: seedSourceId,
      status: "extracted",
      runType: "test",
      rawTextLength: 280,
      tokenEstimate: 75,
      promptVersion: buildPromptVersionLabel(),
      extractedAt: new Date(),
      notes: "Seeded run for Phase 3 ingestion review.",
    },
  });

  await prisma.source.update({
    where: { id: seedSourceId },
    data: { lastIngestionRunId: seedRunId },
  });

  await prisma.extractionPacket.upsert({
    where: { ingestionRunId: seedRunId },
    update: {},
    create: {
      ingestionRunId: seedRunId,
      sourceId: seedSourceId,
      sourceTitle: "Grappe Legacy: A Comprehensive Guide",
      sourceType: SourceType.PDF,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PRIVATE,
      sourceSummary:
        "Compiled family notes, land references, and narrative hooks for the Campti–Natchitoches corridor.",
      rawText:
        "Excerpt — The Grappe name threads through Campti and Black Lake. Alexis carried letters north; smoke from winter fields marked gatherings. Oral accounts describe Buford Grappe losing his arm in a hunting accident; treat as hybrid until parish records confirm.",
      instructionsVersion: INSTRUCTIONS_VERSION,
      readyForAI: true,
      packetJson: { seeded: true },
    },
  });

  await prisma.extractionResult.upsert({
    where: { ingestionRunId: seedRunId },
    update: {},
    create: {
      ingestionRunId: seedRunId,
      sourceId: seedSourceId,
      status: "draft",
      summaryDraft:
        "Seeded extraction: family geography, recurring symbols, and one oral-history claim requiring citation.",
      peopleDraft: [
        {
          name: "Alexis Grappe",
          summary: "Carrier of letters; links Campti to larger arcs.",
          confidence: 4,
        },
      ],
      placesDraft: [
        {
          name: "Campti",
          summary: "Town anchor along the corridor.",
          confidence: 5,
        },
      ],
      symbolsDraft: [
        {
          name: "Smoke",
          summary: "Signal and memory across gatherings.",
          confidence: 3,
        },
      ],
      claimsDraft: [
        {
          description: "Buford Grappe lost his arm in a hunting accident.",
          summary: "Buford Grappe lost his arm in a hunting accident.",
          confidence: 3,
        },
      ],
      eventsDraft: [],
      chaptersDraft: [],
      scenesDraft: [],
      questionsDraft: [],
      continuityDraft: [],
      resultJson: { seeded: true },
    },
  });

  const extractedIds = [
    { id: "seed-extracted-person-alexis", entityType: "person" },
    { id: "seed-extracted-place-campti", entityType: "place" },
    { id: "seed-extracted-symbol-smoke", entityType: "symbol" },
    { id: "seed-extracted-claim-buford", entityType: "claim" },
  ] as const;

  for (const row of extractedIds) {
    await prisma.extractedEntity.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        ingestionRunId: seedRunId,
        sourceId: seedSourceId,
        entityType: row.entityType,
        proposedName:
          row.entityType === "person"
            ? "Alexis Grappe"
            : row.entityType === "place"
              ? "Campti"
              : row.entityType === "symbol"
                ? "Smoke"
                : "Buford hunting accident",
        proposedTitle:
          row.entityType === "claim" ? "Buford Grappe hunting accident" : null,
        proposedData:
          row.entityType === "person"
            ? { name: "Alexis Grappe", confidence: 4 }
            : row.entityType === "place"
              ? { name: "Campti", confidence: 5 }
              : row.entityType === "symbol"
                ? { name: "Smoke", confidence: 3 }
                : {
                    description: "Buford Grappe lost his arm in a hunting accident.",
                    confidence: 3,
                  },
        confidence:
          row.entityType === "place" ? 5 : row.entityType === "person" ? 4 : 3,
        reviewStatus: "pending",
      },
    });
  }

  const sourceTextRow = await prisma.sourceText.findUnique({
    where: { sourceId: seedSourceId },
    select: { id: true },
  });

  await prisma.fragment.upsert({
    where: { id: "seed-frag-smoke-memory" },
    update: {},
    create: {
      id: "seed-frag-smoke-memory",
      sourceId: seedSourceId,
      sourceTextId: sourceTextRow?.id ?? null,
      fragmentType: FragmentType.MEMORY,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      text: "Smoke on winter fields marked gatherings — memory before explanation.",
      excerpt: "Smoke on winter fields marked gatherings…",
      summary: "Sensory memory tied to communal gathering.",
      placementStatus: "unplaced",
      reviewStatus: "pending",
      confidence: 3,
      ambiguityLevel: 3,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
      placementCandidates: {
        create: [
          {
            targetType: "scene",
            targetId: "seed-scene-prologue-1",
            targetLabel: "Prologue — opening image",
            confidence: 2,
            rationale: "Sensory image may seed or ground a scene.",
            status: "suggested",
          },
          {
            targetType: "symbol",
            targetId: "seed-symbol-smoke",
            targetLabel: "Smoke",
            confidence: 3,
            rationale: "Explicit smoke imagery.",
            status: "suggested",
          },
        ],
      },
      insights: {
        create: [
          {
            insightType: "theme",
            content: "Memory and signal interwoven before plot articulates them.",
            confidence: 2,
          },
        ],
      },
    },
  });

  await prisma.fragment.upsert({
    where: { id: "seed-frag-oral-buford" },
    update: {},
    create: {
      id: "seed-frag-oral-buford",
      sourceId: seedSourceId,
      sourceTextId: sourceTextRow?.id ?? null,
      fragmentType: FragmentType.ORAL_HISTORY,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.ORAL_HISTORY,
      text: "Oral accounts describe Buford Grappe losing his arm in a hunting accident; treat as hybrid until parish records confirm.",
      placementStatus: "candidate",
      reviewStatus: "pending",
      confidence: 3,
      ambiguityLevel: 4,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
      placementCandidates: {
        create: [
          {
            targetType: "continuity",
            targetLabel: "Verify Buford injury claim",
            confidence: 2,
            rationale: "Hybrid oral/documentary tension.",
            status: "suggested",
          },
          {
            targetType: "question",
            targetId: "seed-oq-francois-doc",
            targetLabel: "Documentation gaps",
            confidence: 1,
            rationale: "Related uncertainty about documentary record.",
            status: "suggested",
          },
        ],
      },
      insights: {
        create: [
          {
            insightType: "tension",
            content: "Oral report vs record verification — keep both visible.",
            confidence: 3,
          },
        ],
      },
    },
  });

  await prisma.brainMemo.upsert({
    where: { id: "seed-brain-synthesis-1" },
    update: {},
    create: {
      id: "seed-brain-synthesis-1",
      title: "Hybridity as method",
      content:
        "When oral and documentary strands disagree, label the seam — fragments are not facts by default.",
      memoType: "synthesis",
      linkedSourceId: seedSourceId,
    },
  });

  await seedOriginWorldAnchor(prisma);
  await seedOpeningTerrainChapterOnePass(prisma);
  await seedFullDemo(prisma);
  await seedConstitutionalRules();
  await seedOntology();
  await seedCharacterEngineSample(prisma);
  await seedEnvironment(prisma);
  await seedPressure(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
