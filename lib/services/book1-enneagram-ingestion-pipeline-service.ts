import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EnneagramArchetype } from "@/lib/domain/enneagram";
import { NINE_TYPE_KNOWLEDGE } from "@/lib/enneagram/nine-type-knowledge";

const REPORT_SOURCE_INGEST = "book1-enneagram-source-ingest.json";
const REPORT_NORMALIZED = "book1-enneagram-normalized-model.json";
const REPORT_CHARACTER_BINDING = "book1-enneagram-character-binding.json";
const REPORT_REVIEW_QUEUE = "book1-enneagram-ingest-review-queue.json";

const TYPE_BY_DIGIT: Record<string, EnneagramArchetype> = {
  "1": "ONE",
  "2": "TWO",
  "3": "THREE",
  "4": "FOUR",
  "5": "FIVE",
  "6": "SIX",
  "7": "SEVEN",
  "8": "EIGHT",
  "9": "NINE",
};

const DIGIT_BY_TYPE: Record<EnneagramArchetype, string> = {
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
};

const WINGS_BY_TYPE: Record<EnneagramArchetype, [EnneagramArchetype, EnneagramArchetype]> = {
  ONE: ["NINE", "TWO"],
  TWO: ["ONE", "THREE"],
  THREE: ["TWO", "FOUR"],
  FOUR: ["THREE", "FIVE"],
  FIVE: ["FOUR", "SIX"],
  SIX: ["FIVE", "SEVEN"],
  SEVEN: ["SIX", "EIGHT"],
  EIGHT: ["SEVEN", "NINE"],
  NINE: ["EIGHT", "ONE"],
};

type UploadedCoreStructure = {
  enneagramType?: string;
  wing?: string;
  instinctualStack?: string[];
};

type UploadedCharacter = {
  character?: string;
  enneagramType?: string;
  wing?: string;
  selfAwarenessLevel?: string;
  selfNarrationAccuracy?: number;
  coreStructure?: UploadedCoreStructure;
  stressSecurityMovement?: {
    underPressure?: string;
    inGrowth?: string;
  };
  levelsOfDevelopment?: {
    currentAwarenessLevel?: string;
    selfAwareness?: string;
  };
  relationshipFieldBehavior?: {
    intimateBehavior?: string;
    kinshipRole?: string;
    powerWorkBehavior?: string;
    socialGroupBehavior?: string;
  };
  attentionEngine?: {
    noticesFirst?: string;
    ignores?: string;
    overFocusesOn?: string;
  };
  distortionEngine?: {
    misinterpretsRealityAs?: string;
    coreNarrativeBias?: string;
  };
  defenseMechanism?: {
    psychologicalProtectionPattern?: string;
  };
  spiritualOrientation?: {
    seeks?: string;
    distorts?: string;
    experiencesMeaning?: string;
  };
  languageImpact?: {
    sentenceStructure?: string;
    silenceVsSpeech?: string;
    emotionalExpression?: string;
    abstractionVsEmbodiment?: string;
  };
  renderMaskingRules?: {
    hideTypeLabelsInProse?: boolean;
    preserveTemporalIntegrity?: boolean;
  };
};

type UploadedBuild = {
  artifact?: string;
  schemaVersion?: string;
  generatedAt?: string;
  characters?: UploadedCharacter[];
};

type IngestionReviewItem = {
  severity: "info" | "warning";
  kind:
    | "source_parse"
    | "type_resolution"
    | "instinct_resolution"
    | "self_awareness_resolution"
    | "language_resolution";
  character: string | null;
  detail: string;
  requiresManualReview: boolean;
};

type StateExpression = {
  expressionId: string;
  enneagramType: EnneagramArchetype;
  stateBand:
    | "baseline_guarded"
    | "baseline_balanced"
    | "stress_reactive"
    | "stress_fragmented"
    | "growth_integrated"
    | "growth_transcendent";
  perceptionFilter: string;
  distortionEngine: string;
  defenseMechanism: string;
  relationshipFieldBehavior: string;
  languageImpactRule: string;
};

type PipelineOptions = {
  sourcePath?: string;
  reportsDirectory?: string;
};

type PipelineResult = {
  sourceReportPath: string;
  normalizedModelReportPath: string;
  characterBindingReportPath: string;
  reviewQueueReportPath: string;
  reviewQueue: IngestionReviewItem[];
};

function normalizeText(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function resolveEnneagramType(raw: string | null | undefined): EnneagramArchetype | null {
  const next = normalizeText(raw)?.toUpperCase();
  if (!next) return null;
  if (next in NINE_TYPE_KNOWLEDGE) return next as EnneagramArchetype;
  if (next in TYPE_BY_DIGIT) return TYPE_BY_DIGIT[next];
  return null;
}

function resolveWing(rawWing: string | null | undefined, coreType: EnneagramArchetype | null): string | null {
  const wing = normalizeText(rawWing)?.toLowerCase();
  if (!wing) return null;
  const match = wing.match(/w?\s*([1-9])/);
  if (!match) return null;
  const resolvedType = TYPE_BY_DIGIT[match[1]];
  if (!resolvedType) return null;
  if (!coreType) return resolvedType;
  const [left, right] = WINGS_BY_TYPE[coreType];
  if (resolvedType !== left && resolvedType !== right) return null;
  return resolvedType;
}

function tryParseAccuracyFromNarration(value: string | null | undefined): number | null {
  const text = normalizeText(value);
  if (!text) return null;
  const percent = text.match(/(\d{1,3})\s*%/);
  if (!percent) return null;
  const numeric = Number(percent[1]);
  if (Number.isNaN(numeric)) return null;
  return Math.max(0, Math.min(1, numeric / 100));
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function collectLexiconByType(characters: UploadedCharacter[]): Record<EnneagramArchetype, Record<string, string[]>> {
  const byType = {} as Record<EnneagramArchetype, Record<string, string[]>>;
  for (const archetype of Object.keys(NINE_TYPE_KNOWLEDGE) as EnneagramArchetype[]) {
    byType[archetype] = {
      perception: [],
      distortion: [],
      defense: [],
      relationship: [],
      spiritual: [],
      language: [],
    };
  }

  for (const character of characters) {
    const coreType = resolveEnneagramType(character.coreStructure?.enneagramType ?? character.enneagramType);
    if (!coreType) continue;
    byType[coreType].perception.push(
      ...uniqueNonEmpty([
        character.attentionEngine?.noticesFirst,
        character.attentionEngine?.ignores,
        character.attentionEngine?.overFocusesOn,
      ]),
    );
    byType[coreType].distortion.push(
      ...uniqueNonEmpty([
        character.distortionEngine?.misinterpretsRealityAs,
        character.distortionEngine?.coreNarrativeBias,
      ]),
    );
    byType[coreType].defense.push(...uniqueNonEmpty([character.defenseMechanism?.psychologicalProtectionPattern]));
    byType[coreType].relationship.push(
      ...uniqueNonEmpty([
        character.relationshipFieldBehavior?.intimateBehavior,
        character.relationshipFieldBehavior?.kinshipRole,
        character.relationshipFieldBehavior?.powerWorkBehavior,
        character.relationshipFieldBehavior?.socialGroupBehavior,
      ]),
    );
    byType[coreType].spiritual.push(
      ...uniqueNonEmpty([
        character.spiritualOrientation?.seeks,
        character.spiritualOrientation?.distorts,
        character.spiritualOrientation?.experiencesMeaning,
      ]),
    );
    byType[coreType].language.push(
      ...uniqueNonEmpty([
        character.languageImpact?.sentenceStructure,
        character.languageImpact?.silenceVsSpeech,
        character.languageImpact?.emotionalExpression,
        character.languageImpact?.abstractionVsEmbodiment,
      ]),
    );
  }

  return byType;
}

function buildStateExpressions(lexiconByType: Record<EnneagramArchetype, Record<string, string[]>>): StateExpression[] {
  const stateBands: StateExpression["stateBand"][] = [
    "baseline_guarded",
    "baseline_balanced",
    "stress_reactive",
    "stress_fragmented",
    "growth_integrated",
    "growth_transcendent",
  ];
  const rows: StateExpression[] = [];

  for (const archetype of Object.keys(NINE_TYPE_KNOWLEDGE) as EnneagramArchetype[]) {
    const knowledge = NINE_TYPE_KNOWLEDGE[archetype];
    const lexicon = lexiconByType[archetype];
    for (const stateBand of stateBands) {
      const suffix =
        stateBand === "baseline_guarded"
          ? "under guarded baseline attention"
          : stateBand === "baseline_balanced"
            ? "under balanced baseline attention"
            : stateBand === "stress_reactive"
              ? `under stress movement toward ${knowledge.stressTarget}`
              : stateBand === "stress_fragmented"
                ? `under fragmented stress movement toward ${knowledge.stressTarget}`
                : stateBand === "growth_integrated"
                  ? `under growth movement toward ${knowledge.growthTarget}`
                  : `under transcendent growth movement toward ${knowledge.growthTarget}`;

      rows.push({
        expressionId: `${archetype.toLowerCase()}-${stateBand}`,
        enneagramType: archetype,
        stateBand,
        perceptionFilter: lexicon.perception[0] ?? `${knowledge.innerVoiceToneDefaults} ${suffix}`,
        distortionEngine: lexicon.distortion[0] ?? `${knowledge.contradictionDefaults} ${suffix}`,
        defenseMechanism: lexicon.defense[0] ?? knowledge.selfJustificationDefaults,
        relationshipFieldBehavior: lexicon.relationship[0] ?? knowledge.voicePattern.conflictStyle,
        languageImpactRule: lexicon.language[0] ?? knowledge.voicePattern.selfNarrationStyle,
      });
    }
  }

  return rows;
}

function buildWingVariants() {
  const rows: Array<{
    variantId: string;
    enneagramType: EnneagramArchetype;
    wingType: EnneagramArchetype;
    shorthand: string;
  }> = [];

  for (const archetype of Object.keys(WINGS_BY_TYPE) as EnneagramArchetype[]) {
    for (const wing of WINGS_BY_TYPE[archetype]) {
      rows.push({
        variantId: `${archetype.toLowerCase()}-w${DIGIT_BY_TYPE[wing]}`,
        enneagramType: archetype,
        wingType: wing,
        shorthand: `${DIGIT_BY_TYPE[archetype]}w${DIGIT_BY_TYPE[wing]}`,
      });
    }
  }

  return rows;
}

export class Book1EnneagramIngestionPipelineService {
  private readonly sourcePath: string;
  private readonly reportsDirectory: string;

  constructor(options: PipelineOptions = {}) {
    this.sourcePath =
      options.sourcePath ??
      path.join(process.cwd(), "reports", "book1-chapter-01-enneagram-consciousness-engine.json");
    this.reportsDirectory = options.reportsDirectory ?? path.join(process.cwd(), "reports");
  }

  async run(): Promise<PipelineResult> {
    await mkdir(this.reportsDirectory, { recursive: true });

    const rawSourceText = await readFile(this.sourcePath, "utf8");
    const sourceSha256 = createHash("sha256").update(rawSourceText).digest("hex");
    const sourceBytes = Buffer.byteLength(rawSourceText, "utf8");
    const generatedAt = new Date().toISOString();

    const reviewQueue: IngestionReviewItem[] = [];
    let uploadedBuild: UploadedBuild = {};
    try {
      uploadedBuild = JSON.parse(rawSourceText) as UploadedBuild;
    } catch {
      reviewQueue.push({
        severity: "warning",
        kind: "source_parse",
        character: null,
        detail: "Uploaded source is not parseable JSON; fallback normalization produced empty character set.",
        requiresManualReview: true,
      });
      uploadedBuild = { characters: [] };
    }

    const characters = Array.isArray(uploadedBuild.characters) ? uploadedBuild.characters : [];
    const lexiconByType = collectLexiconByType(characters);
    const stateExpressions = buildStateExpressions(lexiconByType);

    const sourceReport = {
      artifact: "book1_enneagram_source_ingest",
      schemaVersion: "1.0.0",
      generatedAt,
      sourceRegistration: {
        sourceId: "book1-source-section-xiii-enneagram-upload",
        title: "Book 1 Enneagram Uploaded Simulation Build",
        sourceKind: "research_note",
        domain: "book1_consciousness_subsystem",
        canonicalChronologyScope: "book1_chapter_01_only",
        provenance: {
          sourcePath: path.relative(process.cwd(), this.sourcePath).replaceAll("\\", "/"),
          sourceSha256,
          sourceBytes,
          uploadedArtifact: uploadedBuild.artifact ?? null,
          uploadedSchemaVersion: uploadedBuild.schemaVersion ?? null,
          uploadedGeneratedAt: uploadedBuild.generatedAt ?? null,
        },
        preservation: {
          preservedExactly: true,
          rawSourceTextExact: rawSourceText,
        },
      },
    };

    const normalizedModel = {
      artifact: "book1_enneagram_normalized_model",
      schemaVersion: "1.0.0",
      generatedAt,
      sourceRef: sourceReport.sourceRegistration.sourceId,
      normalized: {
        coreTypes: (Object.keys(NINE_TYPE_KNOWLEDGE) as EnneagramArchetype[]).map((archetype) => {
          const row = NINE_TYPE_KNOWLEDGE[archetype];
          return {
            enneagramType: archetype,
            digit: DIGIT_BY_TYPE[archetype],
            coreFear: row.coreFearDefault,
            coreDesire: row.coreDesireDefault,
            vice: row.viceDefault,
            virtue: row.virtueDefault,
            egoFixation: row.egoFixationDefault,
          };
        }),
        wingVariants: buildWingVariants(),
        stateExpressions,
        growthStressMovement: (Object.keys(NINE_TYPE_KNOWLEDGE) as EnneagramArchetype[]).map((archetype) => {
          const row = NINE_TYPE_KNOWLEDGE[archetype];
          return {
            enneagramType: archetype,
            stressTarget: row.stressTarget,
            stressNotes: row.stressMovementNotes,
            growthTarget: row.growthTarget,
            growthNotes: row.growthMovementNotes,
          };
        }),
        perceptionFilters: lexiconByType,
        distortionEngines: (Object.keys(lexiconByType) as EnneagramArchetype[]).map((archetype) => ({
          enneagramType: archetype,
          values: lexiconByType[archetype].distortion,
        })),
        defenseMechanisms: (Object.keys(lexiconByType) as EnneagramArchetype[]).map((archetype) => ({
          enneagramType: archetype,
          values: lexiconByType[archetype].defense,
        })),
        relationshipFieldBehavior: (Object.keys(lexiconByType) as EnneagramArchetype[]).map((archetype) => ({
          enneagramType: archetype,
          values: lexiconByType[archetype].relationship,
        })),
        spiritualOrientation: (Object.keys(lexiconByType) as EnneagramArchetype[]).map((archetype) => ({
          enneagramType: archetype,
          values: lexiconByType[archetype].spiritual,
        })),
        languageImpactRules: (Object.keys(lexiconByType) as EnneagramArchetype[]).map((archetype) => ({
          enneagramType: archetype,
          values: lexiconByType[archetype].language,
        })),
      },
      governance: {
        noRawEnneagramLabelsInProse: true,
        noDirectSourceTextToProse: true,
        requireConsciousnessMediationLayer: true,
        preserveCanonAndChronologyProtections: true,
      },
    };

    const characterBindings = characters.map((character, index) => {
      const characterName = normalizeText(character.character) ?? `character_${index + 1}`;
      const resolvedType = resolveEnneagramType(character.coreStructure?.enneagramType ?? character.enneagramType);
      const resolvedWing = resolveWing(character.coreStructure?.wing ?? character.wing, resolvedType);
      const instinctualStack = character.coreStructure?.instinctualStack ?? [];
      const awarenessLevel =
        normalizeText(character.levelsOfDevelopment?.currentAwarenessLevel) ??
        normalizeText(character.selfAwarenessLevel) ??
        "unresolved";
      const selfNarrationAccuracy =
        typeof character.selfNarrationAccuracy === "number"
          ? Math.max(0, Math.min(1, character.selfNarrationAccuracy))
          : tryParseAccuracyFromNarration(character.levelsOfDevelopment?.selfAwareness);

      if (!resolvedType) {
        reviewQueue.push({
          severity: "warning",
          kind: "type_resolution",
          character: characterName,
          detail: "Could not resolve Enneagram type from uploaded source.",
          requiresManualReview: true,
        });
      }
      if (instinctualStack.length === 0) {
        reviewQueue.push({
          severity: "warning",
          kind: "instinct_resolution",
          character: characterName,
          detail: "Instinctual stack missing; fallback left empty.",
          requiresManualReview: true,
        });
      }
      if (selfNarrationAccuracy === null) {
        reviewQueue.push({
          severity: "warning",
          kind: "self_awareness_resolution",
          character: characterName,
          detail: "Self narration accuracy not resolvable from uploaded fields.",
          requiresManualReview: true,
        });
      }
      if (!character.languageImpact) {
        reviewQueue.push({
          severity: "warning",
          kind: "language_resolution",
          character: characterName,
          detail: "Language under pressure block missing; mediation fallback required.",
          requiresManualReview: true,
        });
      }

      return {
        character: characterName,
        enneagramType: resolvedType,
        wing: resolvedWing,
        instinctualStack,
        selfAwarenessLevel: awarenessLevel,
        selfNarrationAccuracy,
        stressSecurityPattern: {
          underPressure: character.stressSecurityMovement?.underPressure ?? null,
          inGrowth: character.stressSecurityMovement?.inGrowth ?? null,
        },
        relationalFieldProfile: character.relationshipFieldBehavior ?? null,
        languageUnderPressure: character.languageImpact ?? null,
        mediationRouting: {
          routeThroughConsciousnessLayer: true,
          routeThroughMediationLayer: true,
          allowDirectSourceToRenderer: false,
          allowRawTypologyLabelsInRenderedProse: false,
          temporalGatingRequired: true,
          canonGatingRequired: true,
          developmentalMaturitySeparatedFromEnneagram: true,
          intimacyEngineSeparatedFromEnneagram: true,
        },
      };
    });

    const characterBindingReport = {
      artifact: "book1_enneagram_character_binding",
      schemaVersion: "1.0.0",
      generatedAt,
      sourceRef: sourceReport.sourceRegistration.sourceId,
      bindings: characterBindings,
    };

    const reviewQueueReport = {
      artifact: "book1_enneagram_ingest_review_queue",
      schemaVersion: "1.0.0",
      generatedAt,
      sourceRef: sourceReport.sourceRegistration.sourceId,
      safeguards: {
        noRawEnneagramLabelsInProse: true,
        noDirectProseRenderingFromSourceText: true,
        temporalGatingRemainsEnforced: true,
        developmentalMaturityAndIntimacySeparatedFromEnneagram: true,
      },
      unresolvedMappings: reviewQueue,
    };

    const sourceReportPath = path.join(this.reportsDirectory, REPORT_SOURCE_INGEST);
    const normalizedModelReportPath = path.join(this.reportsDirectory, REPORT_NORMALIZED);
    const characterBindingReportPath = path.join(this.reportsDirectory, REPORT_CHARACTER_BINDING);
    const reviewQueueReportPath = path.join(this.reportsDirectory, REPORT_REVIEW_QUEUE);

    await writeFile(sourceReportPath, `${JSON.stringify(sourceReport, null, 2)}\n`, "utf8");
    await writeFile(normalizedModelReportPath, `${JSON.stringify(normalizedModel, null, 2)}\n`, "utf8");
    await writeFile(characterBindingReportPath, `${JSON.stringify(characterBindingReport, null, 2)}\n`, "utf8");
    await writeFile(reviewQueueReportPath, `${JSON.stringify(reviewQueueReport, null, 2)}\n`, "utf8");

    return {
      sourceReportPath,
      normalizedModelReportPath,
      characterBindingReportPath,
      reviewQueueReportPath,
      reviewQueue,
    };
  }
}
