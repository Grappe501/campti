import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Book1ContentMode, Book1DensityLabel, Book1SourceKind } from "@/lib/domain/book1-ingestion";
import { prisma } from "@/lib/prisma";

export const BOOK1_SUPPORTED_CONTENT_MODES: Book1ContentMode[] = [
  "history",
  "lineage",
  "worldbuilding",
  "scene_text",
  "pov_text",
  "setting_text",
  "symbolic_text",
  "timeline_text",
  "interpretive_text",
];

export const BOOK1_SUPPORTED_DENSITY_LABELS: Book1DensityLabel[] = [
  "history_dense",
  "scene_dense",
  "pov_dense",
  "setting_dense",
  "lineage_dense",
  "interpretive_dense",
  "mixed_dense",
];

export type RegisterBook1SourceInput = {
  title: string;
  raw_text: string;
  upload_sequence?: number;
  chunk_number?: number;
  file_name?: string;
  book_number?: number;
  source_kind: Book1SourceKind;
  dominant_content_mode: Book1ContentMode;
  secondary_content_modes?: Book1ContentMode[];
  notes?: string;
};

export type RegisterBook1SourceResult = {
  source_id: string;
  source_key: string;
  persisted: true;
  provenance: {
    upload_sequence: number | null;
    chunk_number: number | null;
    file_name: string | null;
    book_number: number;
  };
};

export type Book1ChunkClassificationResult = {
  primary_mode: Book1ContentMode;
  secondary_modes: Book1ContentMode[];
  density_label: Book1DensityLabel;
  mode_scores: Record<Book1ContentMode, number>;
  rationale: string[];
};

export type Book1ProvisionalSegment = {
  provisionalKey: string;
  category:
    | "atomic_claim"
    | "scene_fragment"
    | "setting_passage"
    | "observer_passage"
    | "lineage_fact"
    | "symbolic_motif"
    | "interpretive_passage"
    | "timeline_fact";
  textContent: string;
  startOffset?: number;
  endOffset?: number;
  label?: string;
};

export interface Book1SourceRegistrationService {
  register(input: RegisterBook1SourceInput): Promise<RegisterBook1SourceResult>;
}

export interface Book1ChunkClassifier {
  classify(input: { sourceText: string }): Promise<Book1ChunkClassificationResult>;
}

export interface Book1SegmentationPipeline {
  segment(input: { sourceId: string; sourceText: string }): Promise<Book1ProvisionalSegment[]>;
}

export type PersistBook1SourceInput = {
  id: string;
  source_key: string;
  title: string;
  raw_text: string;
  upload_sequence: number | null;
  chunk_number: number | null;
  file_name: string | null;
  book_number: number;
  source_kind: "UPLOADED_CHUNK" | "RESEARCH_NOTE" | "SYNTHESIS_NOTE" | "SCENE_DRAFT" | "CHARACTER_NOTE";
  dominant_content_mode:
    | "HISTORY"
    | "LINEAGE"
    | "WORLDBUILDING"
    | "SCENE_TEXT"
    | "POV_TEXT"
    | "SETTING_TEXT"
    | "SYMBOLIC_TEXT"
    | "TIMELINE_TEXT"
    | "INTERPRETIVE_TEXT";
  secondary_modes_json: Prisma.JsonValue;
  processing_status: string;
  notes: string | null;
};

export interface Book1SourcePersistenceWriter {
  upsertSource(input: PersistBook1SourceInput): Promise<void>;
}

export class PrismaBook1SourcePersistenceWriter implements Book1SourcePersistenceWriter {
  async upsertSource(input: PersistBook1SourceInput): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO "sources" (
        "id",
        "source_key",
        "title",
        "raw_text",
        "upload_sequence",
        "chunk_number",
        "file_name",
        "book_number",
        "source_kind",
        "dominant_content_mode",
        "secondary_modes_json",
        "processing_status",
        "notes",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${input.id},
        ${input.source_key},
        ${input.title},
        ${input.raw_text},
        ${input.upload_sequence},
        ${input.chunk_number},
        ${input.file_name},
        ${input.book_number},
        ${input.source_kind},
        ${input.dominant_content_mode},
        ${JSON.stringify(input.secondary_modes_json)},
        ${input.processing_status},
        ${input.notes},
        NOW(),
        NOW()
      )
      ON CONFLICT ("source_key")
      DO UPDATE SET
        "title" = EXCLUDED."title",
        "raw_text" = EXCLUDED."raw_text",
        "upload_sequence" = EXCLUDED."upload_sequence",
        "chunk_number" = EXCLUDED."chunk_number",
        "file_name" = EXCLUDED."file_name",
        "book_number" = EXCLUDED."book_number",
        "source_kind" = EXCLUDED."source_kind",
        "dominant_content_mode" = EXCLUDED."dominant_content_mode",
        "secondary_modes_json" = EXCLUDED."secondary_modes_json",
        "processing_status" = EXCLUDED."processing_status",
        "notes" = EXCLUDED."notes",
        "updated_at" = NOW()
    `;
  }
}

const SOURCE_KIND_TO_DB = {
  uploaded_chunk: "UPLOADED_CHUNK",
  research_note: "RESEARCH_NOTE",
  synthesis_note: "SYNTHESIS_NOTE",
  scene_draft: "SCENE_DRAFT",
  character_note: "CHARACTER_NOTE",
} as const satisfies Record<Book1SourceKind, PersistBook1SourceInput["source_kind"]>;

function sourceKindToDb(kind: Book1SourceKind): PersistBook1SourceInput["source_kind"] {
  return SOURCE_KIND_TO_DB[kind];
}

const CONTENT_MODE_TO_DB = {
  history: "HISTORY",
  lineage: "LINEAGE",
  worldbuilding: "WORLDBUILDING",
  scene_text: "SCENE_TEXT",
  pov_text: "POV_TEXT",
  setting_text: "SETTING_TEXT",
  symbolic_text: "SYMBOLIC_TEXT",
  timeline_text: "TIMELINE_TEXT",
  interpretive_text: "INTERPRETIVE_TEXT",
} as const satisfies Record<Book1ContentMode, PersistBook1SourceInput["dominant_content_mode"]>;

function contentModeToDb(mode: Book1ContentMode): PersistBook1SourceInput["dominant_content_mode"] {
  return CONTENT_MODE_TO_DB[mode];
}

export function buildBook1SourceKey(input: RegisterBook1SourceInput): string {
  const stablePayload = [
    input.title.trim().toLowerCase(),
    input.file_name ?? "",
    String(input.upload_sequence ?? ""),
    String(input.chunk_number ?? ""),
    String(input.book_number ?? 1),
    input.source_kind,
  ].join("|");
  const shortHash = createHash("sha1").update(stablePayload).digest("hex").slice(0, 14);
  return `book1-${shortHash}`;
}

export class PrismaBook1SourceRegistrationService implements Book1SourceRegistrationService {
  constructor(private readonly writer: Book1SourcePersistenceWriter = new PrismaBook1SourcePersistenceWriter()) {}

  async register(input: RegisterBook1SourceInput): Promise<RegisterBook1SourceResult> {
    if (input.title.trim().length === 0) throw new Error("title must not be empty");
    if (input.raw_text.trim().length === 0) throw new Error("raw_text must not be empty");

    const source_key = buildBook1SourceKey(input);
    const source_id = `book1-source-${source_key}`;
    const secondary = (input.secondary_content_modes ?? [])
      .filter((mode) => mode !== input.dominant_content_mode)
      .slice(0, 3);

    await this.writer.upsertSource({
      id: source_id,
      source_key,
      title: input.title,
      raw_text: input.raw_text,
      upload_sequence: input.upload_sequence ?? null,
      chunk_number: input.chunk_number ?? null,
      file_name: input.file_name ?? null,
      book_number: input.book_number ?? 1,
      source_kind: sourceKindToDb(input.source_kind),
      dominant_content_mode: contentModeToDb(input.dominant_content_mode),
      secondary_modes_json: secondary,
      processing_status: "registered",
      notes: input.notes ?? null,
    });

    return {
      source_id,
      source_key,
      persisted: true,
      provenance: {
        upload_sequence: input.upload_sequence ?? null,
        chunk_number: input.chunk_number ?? null,
        file_name: input.file_name ?? null,
        book_number: input.book_number ?? 1,
      },
    };
  }
}

type ModeKeywordBank = Record<Book1ContentMode, RegExp[]>;

const MODE_KEYWORD_BANK: ModeKeywordBank = {
  history: [/\b(century|historical|era|colonial|archive|documented|treaty|expedition)\b/gi],
  lineage: [/\b(lineage|genealogy|ancestor|descendant|mother|father|daughter|son|family)\b/gi],
  worldbuilding: [/\b(system|society|authority|custom|protocol|trade network|infrastructure)\b/gi],
  scene_text: [/\b(scene|moment|stood|walked|river|light|dawn|voice)\b/gi],
  pov_text: [/\b(pov|point of view|she saw|he felt|inner|perspective|awareness)\b/gi],
  setting_text: [/\b(riverbank|bank|clearing|house|current|mist|terrain|route)\b/gi],
  symbolic_text: [/\b(symbol|motif|metaphor|echo|ritual image|land memory)\b/gi],
  timeline_text: [/\b(\d{4}|timeline|before|after|during|anchor date|sequence)\b/gi],
  interpretive_text: [/\b(means|suggests|interprets|analysis|implies|therefore|this scene shows)\b/gi],
};

function scoreMode(text: string, patterns: RegExp[]): number {
  let score = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    score += matches ? matches.length : 0;
  }
  return score;
}

function pickDensityLabel(primaryMode: Book1ContentMode, sortedScores: [Book1ContentMode, number][]): Book1DensityLabel {
  const [best, bestScore] = sortedScores[0];
  const [, secondScore] = sortedScores[1];
  const closeModes = secondScore > 0 && bestScore - secondScore <= 1;
  if (closeModes) return "mixed_dense";

  const map: Record<Book1ContentMode, Book1DensityLabel> = {
    history: "history_dense",
    lineage: "lineage_dense",
    worldbuilding: "mixed_dense",
    scene_text: "scene_dense",
    pov_text: "pov_dense",
    setting_text: "setting_dense",
    symbolic_text: "mixed_dense",
    timeline_text: "history_dense",
    interpretive_text: "interpretive_dense",
  };
  return map[best ?? primaryMode];
}

export class DeterministicBook1ChunkClassifier implements Book1ChunkClassifier {
  async classify(input: { sourceText: string }): Promise<Book1ChunkClassificationResult> {
    const normalized = input.sourceText.toLowerCase();
    const mode_scores = {} as Record<Book1ContentMode, number>;
    for (const mode of BOOK1_SUPPORTED_CONTENT_MODES) {
      mode_scores[mode] = scoreMode(normalized, MODE_KEYWORD_BANK[mode]);
    }

    const sortedScores = [...Object.entries(mode_scores)] as [Book1ContentMode, number][];
    sortedScores.sort((a, b) => b[1] - a[1]);

    const primary_mode = resolvePrimaryMode(sortedScores);
    const secondary_modes = sortedScores
      .filter(([mode, score]) => mode !== primary_mode && score > 0)
      .slice(0, 3)
      .map(([mode]) => mode);
    const density_label = pickDensityLabel(primary_mode, sortedScores);

    return {
      primary_mode,
      secondary_modes,
      density_label,
      mode_scores,
      rationale: [
        `primary_mode=${primary_mode}`,
        `secondary_modes=${secondary_modes.join(",") || "none"}`,
        `density_label=${density_label}`,
      ],
    };
  }
}

function resolvePrimaryMode(sortedScores: [Book1ContentMode, number][]): Book1ContentMode {
  const [bestMode, bestScore] = sortedScores[0];
  if (bestScore <= 0) return "worldbuilding";

  const lineageScore = sortedScores.find(([mode]) => mode === "lineage")?.[1] ?? 0;
  const historyScore = sortedScores.find(([mode]) => mode === "history")?.[1] ?? 0;

  // Favor lineage when kinship/genealogy language is effectively tied with history markers.
  if (bestMode === "history" && lineageScore > 0 && historyScore - lineageScore <= 1) {
    return "lineage";
  }
  return bestMode;
}

export class StubBook1SegmentationPipeline implements Book1SegmentationPipeline {
  async segment(_input: { sourceId: string; sourceText: string }): Promise<Book1ProvisionalSegment[]> {
    throw new Error(
      "StubBook1SegmentationPipeline is scaffolding only. Implement deterministic segmentation in Script 03.",
    );
  }
}
