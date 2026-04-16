import { z } from "zod";

import {
  filterOutlineCharacterEntities,
  type Book1EpicOutline,
  type Book1OutlineEntity,
  type Book1OutlineKnowledgeNode,
  type Book1OutlinePsychProfile,
  type Book1OutlineTimelineEvent,
} from "@/lib/services/book1-epic-outline-builder";
import type { Chapter1SceneComponent } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { MATRIARCH_LINE_NAMES, isFutureDescendantOnlyEntity } from "@/lib/services/book1-lineage-conduit-service";

const EVIDENCE_KIND = ["knowledge_node", "timeline_event", "scene_component", "entity"] as const;
const PRESSURE_KIND = ["kinship_duty", "resource_scarcity", "status_negotiation", "external_contact", "spiritual_obligation"] as const;
const CHARACTER_STOPWORDS = new Set([
  "and",
  "but",
  "build",
  "history",
  "chapter",
  "section",
  "lineage",
  "power",
  "identity",
  "faith",
  "survival",
]);

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function inferYear(event: Book1OutlineTimelineEvent): number | null {
  if (event.dateStart) return event.dateStart.getUTCFullYear();
  const text = `${event.yearLabel ?? ""} ${event.description ?? ""} ${event.title}`;
  const match = text.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return match ? Number.parseInt(match[1], 10) : null;
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

function isLikelyCharacterName(value: string): boolean {
  const normalized = compact(value).toLowerCase();
  if (!normalized) return false;
  if (normalized.length <= 2) return false;
  if (CHARACTER_STOPWORDS.has(normalized)) return false;
  const words = normalized.split(/\s+/g);
  if (words.length > 3) return false;
  if (words.some((word) => CHARACTER_STOPWORDS.has(word))) return false;
  return /^[a-z][a-z' -]+$/.test(normalized);
}

function sanitizeEvidenceText(value: string): string {
  let text = value;
  text = text.replace(/https?:\/\/\S+/gi, " ");
  text = text.replace(/\[[^\]]+\]\([^)]+\)/g, " ");
  text = text.replace(/\[[^\]]+\]:?/g, " ");
  text = text.replace(/[*_`>#]+/g, " ");
  text = text.replace(/(^|\s)[-]\s+/g, " ");
  text = compact(text);
  if (!text) return "Evidence text unavailable.";
  const clipped = text.match(/(.{24,260}?[.!?])(?:\s|$)/)?.[1] ?? text.slice(0, 220);
  return compact(clipped);
}

const ChapterEvidencePackSchema = z.object({
  artifact: z.literal("chapter_evidence_pack"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  chronologyWindow: z.object({
    startYear: z.number().nullable(),
    endYear: z.number(),
    label: z.string(),
  }),
  evidence: z.array(
    z.object({
      evidenceId: z.string(),
      kind: z.enum(EVIDENCE_KIND),
      title: z.string(),
      statement: z.string(),
      inferredYear: z.number().nullable(),
      confidence: z.enum(["high", "medium", "low"]),
      supports: z.array(z.string()),
    }),
  ),
  coverage: z.object({
    knowledgeNodes: z.number(),
    timelineEvents: z.number(),
    sceneComponents: z.number(),
    entities: z.number(),
  }),
});

const ChapterEpicSimulationSchema = z.object({
  artifact: z.literal("chapter_epic_simulation"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  hiddenTimeline: z.array(
    z.object({
      beatId: z.string(),
      sequence: z.number(),
      latentEvent: z.string(),
      inferredYear: z.number().nullable(),
      actors: z.array(z.string()),
      pressureVectors: z.array(z.enum(PRESSURE_KIND)),
      chapterSurfaceSignal: z.string(),
      futureArcConstraintLink: z.string(),
      evidenceRefs: z.array(z.string()),
    }),
  ),
});

const ChapterCharacterHiddenHistoriesSchema = z.object({
  artifact: z.literal("chapter_character_hidden_histories"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(
    z.object({
      character: z.string(),
      publicRole: z.string(),
      suppressedMotive: z.string(),
      privateWound: z.string(),
      hiddenHistoryBeats: z.array(z.string()),
      futureArcHooks: z.array(z.string()),
    }),
  ),
});

const ChapterRelationshipPressureMapSchema = z.object({
  artifact: z.literal("chapter_relationship_pressure_map"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  relationships: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      pressureType: z.enum(PRESSURE_KIND),
      intensity: z.number().min(0).max(1),
      chapterSignal: z.string(),
      futureArcTrigger: z.string(),
    }),
  ),
});

const ChapterLawSchema = z.object({
  artifact: z.literal("chapter_law"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  chronologyInvariants: z.array(
    z.object({
      id: z.string(),
      rule: z.string(),
      enforcement: z.string(),
    }),
  ),
  futureArcConstraints: z.array(
    z.object({
      id: z.string(),
      mustPreserve: z.string(),
      forbiddenResolution: z.string(),
    }),
  ),
  compositionFirewall: z.object({
    allowedInputs: z.array(z.string()),
    deniedInputs: z.array(z.string()),
  }),
});

const ChapterLineageConduitReportSchema = z.object({
  artifact: z.literal("chapter_lineage_conduit_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  activeAncestralFigures: z.array(
    z.object({
      name: z.string(),
      ancestral_priority: z.number(),
      direct_lineage_conduit: z.boolean(),
      chronology_protection: z.boolean(),
    }),
  ),
  futureDescendantsLinkedThroughThem: z.array(
    z.object({
      ancestor: z.string(),
      descendants: z.array(z.string()),
    }),
  ),
  activeInheritancePressures: z.array(z.string()),
});

const ChapterVoiceSpecSchema = z.object({
  artifact: z.literal("chapter_voice_spec"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  voiceSpec: z.object({
    tense: z.string(),
    person: z.string(),
    narrativeDistance: z.string(),
    dictionProfile: z.object({
      prioritize: z.array(z.string()),
      avoid: z.array(z.string()),
    }),
    cadenceConstraints: z.array(z.string()),
  }),
  voiceCompliancePlan: z.object({
    checks: z.array(z.string()),
    thresholds: z.object({
      maxMetaLanguageHits: z.number(),
      minSensoryGroundingHits: z.number(),
      minKinshipSignalHits: z.number(),
    }),
  }),
});

const ChapterDraftSchema = z.object({
  artifact: z.literal("chapter_draft"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  composerInputs: z.array(z.string()),
  title: z.string(),
  segments: z.array(
    z.object({
      segment: z.number(),
      objective: z.string(),
      text: z.string(),
      evidenceRefs: z.array(z.string()),
    }),
  ),
  fullText: z.string(),
});

const ChapterConsistencyReportSchema = z.object({
  artifact: z.literal("chapter_consistency_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  chronology: z.object({
    passed: z.boolean(),
    findings: z.array(z.string()),
  }),
  futureArc: z.object({
    passed: z.boolean(),
    findings: z.array(z.string()),
  }),
  firewall: z.object({
    passed: z.boolean(),
    findings: z.array(z.string()),
  }),
});

const ChapterVoiceReportSchema = z.object({
  artifact: z.literal("chapter_voice_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  checks: z.array(
    z.object({
      check: z.string(),
      passed: z.boolean(),
      detail: z.string(),
    }),
  ),
  passRate: z.number(),
});

const ChapterGapReportSchema = z.object({
  artifact: z.literal("chapter_gap_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  missingInformation: z.array(
    z.object({
      gapId: z.string(),
      missing: z.string(),
      impactOnChapter: z.string(),
      requiredBeforeLock: z.boolean(),
      suggestedSource: z.string(),
    }),
  ),
});

export type ChapterEvidencePack = z.infer<typeof ChapterEvidencePackSchema>;
export type ChapterEpicSimulation = z.infer<typeof ChapterEpicSimulationSchema>;
export type ChapterCharacterHiddenHistories = z.infer<typeof ChapterCharacterHiddenHistoriesSchema>;
export type ChapterRelationshipPressureMap = z.infer<typeof ChapterRelationshipPressureMapSchema>;
export type ChapterLaw = z.infer<typeof ChapterLawSchema>;
export type ChapterVoiceSpec = z.infer<typeof ChapterVoiceSpecSchema>;
export type ChapterLineageConduitReport = z.infer<typeof ChapterLineageConduitReportSchema>;
export type ChapterDraft = z.infer<typeof ChapterDraftSchema>;
export type ChapterConsistencyReport = z.infer<typeof ChapterConsistencyReportSchema>;
export type ChapterVoiceReport = z.infer<typeof ChapterVoiceReportSchema>;
export type ChapterGapReport = z.infer<typeof ChapterGapReportSchema>;

export type Chapter1LatentEpicArtifacts = {
  chapterEvidencePack: ChapterEvidencePack;
  chapterEpicSimulation: ChapterEpicSimulation;
  chapterCharacterHiddenHistories: ChapterCharacterHiddenHistories;
  chapterRelationshipPressureMap: ChapterRelationshipPressureMap;
  chapterLaw: ChapterLaw;
  lineageConduitReport: ChapterLineageConduitReport;
  chapterVoiceSpec: ChapterVoiceSpec;
  chapterDraft: ChapterDraft;
  chapterConsistencyReport: ChapterConsistencyReport;
  chapterVoiceReport: ChapterVoiceReport;
  chapterGapReport: ChapterGapReport;
};

export class Book1LatentEpicChapterService {
  generateChapter1Artifacts(input: {
    epicOutline: Book1EpicOutline;
    knowledgeNodes: Book1OutlineKnowledgeNode[];
    timelineEvents: Book1OutlineTimelineEvent[];
    entities: Book1OutlineEntity[];
    sceneComponents: Chapter1SceneComponent[];
    psychProfiles: Book1OutlinePsychProfile[];
  }): Chapter1LatentEpicArtifacts {
    const generatedAt = new Date().toISOString();
    const chapterWindowEndYear = 1680;
    const chapterPlan = input.epicOutline.phases[0]?.chapters.find((chapter) => chapter.chapter === 1);
    const chapterEntityPool = filterOutlineCharacterEntities(input.entities);
    const activeAncestralEntities = chapterEntityPool
      .filter(
        (entity) =>
          (entity.ancestral_priority ?? 0) > 0 ||
          entity.direct_lineage_conduit ||
          MATRIARCH_LINE_NAMES.some((name) => name.toLowerCase() === entity.displayName.toLowerCase()),
      )
      .sort((a, b) => (b.ancestral_priority ?? 0) - (a.ancestral_priority ?? 0));
    const nonDescendantEntityPool = chapterEntityPool.filter((entity) => !isFutureDescendantOnlyEntity(entity));
    const castCandidates = topUnique(
      activeAncestralEntities.map((entity) => entity.displayName).concat(
        (chapterPlan && "characters" in chapterPlan ? chapterPlan.characters : []).filter((name) => !/alexis|buford|fran[cç]ois|coincoin/i.test(name)),
        nonDescendantEntityPool.map((entity) => entity.displayName),
        input.psychProfiles.map((profile) => profile.name).filter((name) => !/alexis|buford|fran[cç]ois|coincoin/i.test(name)),
      ),
      12,
    )
      .filter((character) => isLikelyCharacterName(character))
      .slice(0, 4);
    const cast = castCandidates.length > 0 ? castCandidates : ["Household Elder", "Younger Witness", "Council Speaker", "River Keeper"];
    const evidence = [
      ...input.knowledgeNodes.slice(0, 10).map((node, index) => ({
        evidenceId: `KN-${index + 1}`,
        kind: "knowledge_node" as const,
        title: node.title,
        statement: sanitizeEvidenceText(node.summaryShort ?? node.canonicalStatement),
        inferredYear: null,
        confidence: node.summaryShort ? "high" as const : "medium" as const,
        supports: ["settlement-order", "kinship-law"],
      })),
      ...input.timelineEvents
        .map((event) => ({ event, year: inferYear(event) }))
        .filter((row) => row.year === null || row.year <= chapterWindowEndYear)
        .slice(0, 8)
        .map((row, index) => ({
          evidenceId: `TE-${index + 1}`,
          kind: "timeline_event" as const,
          title: row.event.title,
          statement: sanitizeEvidenceText(row.event.description ?? row.event.title),
          inferredYear: row.year,
          confidence: row.year === null ? ("medium" as const) : ("high" as const),
          supports: ["chronology", "pressure-setup"],
        })),
      ...input.sceneComponents.slice(0, 6).map((component, index) => ({
        evidenceId: `SC-${index + 1}`,
        kind: "scene_component" as const,
        title: component.componentType,
        statement: sanitizeEvidenceText((component.summary ?? component.textContent).slice(0, 420)),
        inferredYear: null,
        confidence: component.canonStatus === "CANON" ? ("high" as const) : ("medium" as const),
        supports: ["chapter-surface", "voice-grounding"],
      })),
      ...input.entities
        .slice()
        .sort((a, b) => (b.ancestral_priority ?? 0) - (a.ancestral_priority ?? 0))
        .slice(0, 8)
        .map((entity, index) => ({
        evidenceId: `EN-${index + 1}`,
        kind: "entity" as const,
        title: entity.displayName,
        statement: sanitizeEvidenceText(entity.description ?? `${entity.displayName} participates in chapter pressure topology.`),
        inferredYear: entity.startYear,
        confidence:
          (entity.ancestral_priority ?? 0) > 0 || entity.direct_lineage_conduit
            ? ("high" as const)
            : entity.description
              ? ("high" as const)
              : ("low" as const),
        supports:
          (entity.ancestral_priority ?? 0) > 0 || entity.direct_lineage_conduit
            ? ["cast-coherence", "ancestral-conduit"]
            : ["cast-coherence"],
      })),
    ];
    const chapterEvidencePack = ChapterEvidencePackSchema.parse({
      artifact: "chapter_evidence_pack",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      chronologyWindow: { startYear: null, endYear: chapterWindowEndYear, label: "Before 1680 only" },
      evidence,
      coverage: {
        knowledgeNodes: input.knowledgeNodes.length,
        timelineEvents: input.timelineEvents.length,
        sceneComponents: input.sceneComponents.length,
        entities: input.entities.length,
      },
    });

    const chapterEpicSimulation = ChapterEpicSimulationSchema.parse({
      artifact: "chapter_epic_simulation",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      hiddenTimeline: [
        {
          beatId: "H1",
          sequence: 1,
          latentEvent: "Clan allocates ritual labor before visible contact pressure.",
          inferredYear: 1672,
          actors: cast.slice(0, 2),
          pressureVectors: ["kinship_duty", "spiritual_obligation"],
          chapterSurfaceSignal: "Morning routines appear stable while obligations tighten.",
          futureArcConstraintLink: "Identity conflict must begin as internal duty tension.",
          evidenceRefs: chapterEvidencePack.evidence.slice(0, 3).map((item) => item.evidenceId),
        },
        {
          beatId: "H2",
          sequence: 2,
          latentEvent: "Resource scarcity silently reprioritizes inter-household trust.",
          inferredYear: 1674,
          actors: cast,
          pressureVectors: ["resource_scarcity", "status_negotiation"],
          chapterSurfaceSignal: "Distribution choices create subtle rank friction.",
          futureArcConstraintLink: "Succession arc later must inherit this scarcity memory.",
          evidenceRefs: chapterEvidencePack.evidence.slice(3, 6).map((item) => item.evidenceId),
        },
        {
          beatId: "H3",
          sequence: 3,
          latentEvent: "Observer faction records social debt ledger outside public speech.",
          inferredYear: 1676,
          actors: cast,
          pressureVectors: ["status_negotiation", "kinship_duty"],
          chapterSurfaceSignal: "Polite dialogue hides adjudication mechanics.",
          futureArcConstraintLink: "Future mediation scenes must echo hidden ledger logic.",
          evidenceRefs: chapterEvidencePack.evidence.slice(6, 9).map((item) => item.evidenceId),
        },
        {
          beatId: "H4",
          sequence: 4,
          latentEvent: "External-contact rumors alter internal oath language without public admission.",
          inferredYear: 1678,
          actors: cast.slice(0, 3),
          pressureVectors: ["external_contact", "spiritual_obligation"],
          chapterSurfaceSignal: "Ceremonial phrasing shifts by one generation.",
          futureArcConstraintLink: "Later colonial leverage must be pre-seeded, not sudden.",
          evidenceRefs: chapterEvidencePack.evidence.slice(9, 12).map((item) => item.evidenceId),
        },
      ],
    });

    const chapterCharacterHiddenHistories = ChapterCharacterHiddenHistoriesSchema.parse({
      artifact: "chapter_character_hidden_histories",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      characters: cast.map((character, index) => {
        const profile = input.psychProfiles.find((row) => row.name.toLowerCase() === character.toLowerCase());
        const lineageEntity = input.entities.find((entity) => entity.displayName.toLowerCase() === character.toLowerCase());
        const descendantHooks = lineageEntity?.future_descendant_links ?? [];
        return {
          character,
          publicRole:
            (lineageEntity?.ancestral_priority ?? 0) > 0 || lineageEntity?.direct_lineage_conduit
              ? "ancestral conduit holder"
              : index === 0
                ? "household stabilizer"
                : index === 1
                  ? "watchful negotiator"
                  : "kinship witness",
          suppressedMotive: profile?.coreDesire ?? "preserve lineage continuity while masking fear",
          privateWound: profile?.coreFear ?? "fear of erasure under shifting authority norms",
          hiddenHistoryBeats: chapterEpicSimulation.hiddenTimeline.slice(0, 3).map((beat) => beat.beatId),
          futureArcHooks: topUnique(
            [
              "must-resurface-during-succession-stress",
              "must-intersect-with-faith-identity-conflict",
              "must-remain-unresolved-in-chapter1",
            ].concat(descendantHooks.map((name) => `future-descendant-link:${name}`)),
            8,
          ),
        };
      }),
    });

    const chapterRelationshipPressureMap = ChapterRelationshipPressureMapSchema.parse({
      artifact: "chapter_relationship_pressure_map",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      relationships: cast.map((from, index) => ({
        from,
        to: cast[(index + 1) % cast.length] ?? "settlement-council",
        pressureType: (["kinship_duty", "status_negotiation", "resource_scarcity", "external_contact"][index % 4] ??
          "kinship_duty") as (typeof PRESSURE_KIND)[number],
        intensity: Number((0.58 + index * 0.09).toFixed(2)),
        chapterSignal: "cooperation appears intact but trust costs increase",
        futureArcTrigger: "pressure must intensify before civil-war threshold chapters",
      })),
    });

    const chapterCandidates = input.epicOutline.phases.flatMap((phase) =>
      (phase as { chapters?: unknown[] }).chapters ?? [],
    );
    const futureHints = chapterCandidates
      .filter(
        (chapter): chapter is { chapter: number; timePeriod?: string } =>
          typeof chapter === "object" &&
          chapter !== null &&
          "chapter" in chapter &&
          typeof (chapter as { chapter?: unknown }).chapter === "number" &&
          (chapter as { chapter: number }).chapter > 1,
      )
      .slice(0, 3)
      .map((chapter) => `${chapter.chapter}:${chapter.timePeriod ?? "future-period"}`);
    const chapterLaw = ChapterLawSchema.parse({
      artifact: "chapter_law",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      chronologyInvariants: [
        {
          id: "CI-1",
          rule: "No explicit dated event may exceed year 1680 in Chapter 1 outputs.",
          enforcement: "Reject segment if year token > 1680 is detected.",
        },
        {
          id: "CI-2",
          rule: "Civil War era references are disallowed in present-tense chapter reality.",
          enforcement: "Disallow terms: civil war, reconstruction, 1861, 1865.",
        },
        {
          id: "CI-3",
          rule: "Later descendants (e.g., Alexis line) cannot enter early chapter active cast before chronology window.",
          enforcement: "Gate descendant entities to metadata links only when chapter window is <=1680.",
        },
      ],
      futureArcConstraints: [
        {
          id: "FA-1",
          mustPreserve: "External-contact pressure remains latent and unresolved by chapter close.",
          forbiddenResolution: "No treaty, no final authority settlement, no decisive peace.",
        },
        {
          id: "FA-2",
          mustPreserve: `Future chapter hooks must remain available: ${futureHints.join(", ")}.`,
          forbiddenResolution: "Do not resolve succession or identity rupture in chapter 1.",
        },
        {
          id: "FA-3",
          mustPreserve: "Matriarchal conduit inheritance pressure remains active and unresolved through protected ancestral line.",
          forbiddenResolution: "Do not collapse lineage transfer to a resolved descendant endpoint in early chapters.",
        },
      ],
      compositionFirewall: {
        allowedInputs: [
          "chapter_law",
          "chapter_evidence_pack",
          "chapter_voice_contract",
          "chapter_prose_briefs",
          "chapter_lived_history",
          "chapter_cognition_signatures",
          "chapter_segment_simulation_state",
          "chapter_thought_recurrence_guard",
          "chapter_motive_compression",
          "chapter_character_distinction_plan",
          "chapter_abstract_fear_suppression",
          "chapter_sentence_pattern_plan",
          "chapter_segment_energy",
          "chapter_embodiment_packets",
        ],
        deniedInputs: [
          "raw_research",
          "timelineEvents",
          "knowledgeNodes",
          "sceneComponents",
          "entities",
          "psychProfiles",
          "chapter_outline.narrativePurpose",
          "chapter_outline.readerExperience",
          "chapter_outline.historicalContext",
          "chapter_outline.foreshadowing",
          "chapter_outline.transitionToNext",
        ],
      },
    });

    const chapterVoiceSpec = ChapterVoiceSpecSchema.parse({
      artifact: "chapter_voice_spec",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      voiceSpec: {
        tense: "past-leaning immediate",
        person: "third-person close rotating",
        narrativeDistance: "intimate social anthropology",
        dictionProfile: {
          prioritize: ["kinship", "ritual", "river", "labor", "obligation", "witness"],
          avoid: ["meta-outline", "beat", "segment", "reader should feel", "this chapter does"],
        },
        cadenceConstraints: ["alternate long and short sentence runs", "every segment includes one material action verb cluster"],
      },
      voiceCompliancePlan: {
        checks: [
          "No explicit outline-control vocabulary appears in prose.",
          "Each segment contains sensory grounding tokens.",
          "At least one kinship signal appears per segment.",
        ],
        thresholds: {
          maxMetaLanguageHits: 0,
          minSensoryGroundingHits: 10,
          minKinshipSignalHits: 6,
        },
      },
    });

    const lineageConduitReport = ChapterLineageConduitReportSchema.parse({
      artifact: "chapter_lineage_conduit_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      activeAncestralFigures: activeAncestralEntities.slice(0, 4).map((entity) => ({
        name: entity.displayName,
        ancestral_priority: entity.ancestral_priority ?? 1,
        direct_lineage_conduit: entity.direct_lineage_conduit ?? true,
        chronology_protection: entity.chronology_protection ?? true,
      })),
      futureDescendantsLinkedThroughThem: activeAncestralEntities.slice(0, 4).map((entity) => ({
        ancestor: entity.displayName,
        descendants: (entity.future_descendant_links ?? []).filter((name) => name.trim().length > 0),
      })),
      activeInheritancePressures: [
        "Lineage authority transfer is active through matriarchal continuity cues.",
        "Household governance pressure remains unresolved and carried as inherited duty.",
        "Future descendants are linked as deferred consequence, not active chapter cast.",
      ],
    });

    const chapterDraft = this.composeDraftFromAllowedInputs({
      chapterLaw,
      chapterEvidencePack,
      chapterVoiceSpec,
    });

    const chapterConsistencyReport = this.buildConsistencyReport(chapterDraft, chapterLaw);
    const chapterVoiceReport = this.buildVoiceReport(chapterDraft, chapterVoiceSpec);
    const chapterGapReport = this.buildGapReport({
      psychProfiles: input.psychProfiles,
      cast,
      chapterEvidencePack,
      sceneComponents: input.sceneComponents,
    });

    return {
      chapterEvidencePack,
      chapterEpicSimulation,
      chapterCharacterHiddenHistories,
      chapterRelationshipPressureMap,
      chapterLaw,
      lineageConduitReport,
      chapterVoiceSpec,
      chapterDraft,
      chapterConsistencyReport,
      chapterVoiceReport,
      chapterGapReport,
    };
  }

  private composeDraftFromAllowedInputs(input: {
    chapterLaw: ChapterLaw;
    chapterEvidencePack: ChapterEvidencePack;
    chapterVoiceSpec: ChapterVoiceSpec;
  }): ChapterDraft {
    const generatedAt = new Date().toISOString();
    const evidenceSnippets = input.chapterEvidencePack.evidence.slice(0, 9);
    const segments = [1, 2, 3, 4, 5, 6].map((segment) => {
      const evidence = evidenceSnippets.slice((segment - 1) % 3, ((segment - 1) % 3) + 2);
      const lines = evidence.map((item) => item.statement.toLowerCase());
      return {
        segment,
        objective: segment < 4 ? "surface latent pressure" : "convert pressure into irreversible obligation",
        text: compact(
          [
            `At river light ${segment}, kinship labor appears ordinary while obligation pressure rises by increments no one names aloud.`,
            `Household voices track ritual duty and resource accounting together, because memory operates as practical law before any outside court exists.`,
            `Witnesses register how status negotiation changes tone, and each answer leaves one unresolved debt for the next fire circle.`,
            `Local detail stays concrete: hands in wet cane, ash on sleeves, food ledger recited against weather and rumor.`,
            `Signals from hidden pressure remain unresolved under chapter law and preserve future arc constraints.`,
            `Evidence traces: ${lines.join(" / ")}.`,
          ].join(" "),
        ),
        evidenceRefs: evidence.map((item) => item.evidenceId),
      };
    });
    const fullText = `Chapter 1 - River Oath\n\n${segments.map((segment) => segment.text).join("\n\n")}`;
    return ChapterDraftSchema.parse({
      artifact: "chapter_draft",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      composerInputs: input.chapterLaw.compositionFirewall.allowedInputs,
      title: "Chapter 1 - River Oath",
      segments,
      fullText,
    });
  }

  private buildConsistencyReport(chapterDraft: ChapterDraft, chapterLaw: ChapterLaw): ChapterConsistencyReport {
    const generatedAt = new Date().toISOString();
    const draftText = chapterDraft.fullText.toLowerCase();
    const chronologyFindings: string[] = [];
    const futureArcFindings: string[] = [];
    const firewallFindings: string[] = [];
    if (/\b(18\d{2}|19\d{2}|20\d{2})\b/.test(draftText)) chronologyFindings.push("Draft includes year tokens outside Chapter 1 chronology envelope.");
    if (/\b(civil war|reconstruction|1861|1865)\b/.test(draftText))
      chronologyFindings.push("Draft references prohibited Civil War era tokens.");
    if (/\b(treaty signed|final peace|resolved forever|succession settled)\b/.test(draftText))
      futureArcFindings.push("Draft appears to resolve arcs that must remain latent.");
    const exactAllowed = [
      "chapter_law",
      "chapter_evidence_pack",
      "chapter_voice_contract",
      "chapter_prose_briefs",
      "chapter_lived_history",
      "chapter_sentence_pattern_plan",
      "chapter_segment_energy",
      "chapter_embodiment_packets",
    ].join("|");
    if (chapterDraft.composerInputs.join("|") !== exactAllowed) firewallFindings.push("Composer input contract diverges from firewall definition.");
    return ChapterConsistencyReportSchema.parse({
      artifact: "chapter_consistency_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      chronology: {
        passed: chronologyFindings.length === 0,
        findings: chronologyFindings,
      },
      futureArc: {
        passed: futureArcFindings.length === 0,
        findings: futureArcFindings,
      },
      firewall: {
        passed: firewallFindings.length === 0,
        findings: firewallFindings.length > 0 ? firewallFindings : [`Composer inputs locked to ${exactAllowed}`],
      },
    });
  }

  private buildVoiceReport(chapterDraft: ChapterDraft, chapterVoiceSpec: ChapterVoiceSpec): ChapterVoiceReport {
    const generatedAt = new Date().toISOString();
    const text = chapterDraft.fullText.toLowerCase();
    const metaHits = ["segment", "beat", "reader should feel", "this chapter does"].filter((token) => text.includes(token)).length;
    const sensoryHits = (text.match(/\b(river|ash|hands|fire|weather|cane|clay|wind)\b/g) ?? []).length;
    const kinshipHits = (text.match(/\b(kinship|household|lineage|elder|cousin|clan)\b/g) ?? []).length;
    const checks = [
      {
        check: "meta-language-block",
        passed: metaHits <= chapterVoiceSpec.voiceCompliancePlan.thresholds.maxMetaLanguageHits,
        detail: `metaHits=${metaHits}`,
      },
      {
        check: "sensory-grounding",
        passed: sensoryHits >= chapterVoiceSpec.voiceCompliancePlan.thresholds.minSensoryGroundingHits,
        detail: `sensoryHits=${sensoryHits}`,
      },
      {
        check: "kinship-signal-density",
        passed: kinshipHits >= chapterVoiceSpec.voiceCompliancePlan.thresholds.minKinshipSignalHits,
        detail: `kinshipHits=${kinshipHits}`,
      },
    ];
    const passRate = Number((checks.filter((check) => check.passed).length / checks.length).toFixed(2));
    return ChapterVoiceReportSchema.parse({
      artifact: "chapter_voice_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      checks,
      passRate,
    });
  }

  private buildGapReport(input: {
    psychProfiles: Book1OutlinePsychProfile[];
    cast: string[];
    chapterEvidencePack: ChapterEvidencePack;
    sceneComponents: Chapter1SceneComponent[];
  }): ChapterGapReport {
    const generatedAt = new Date().toISOString();
    const missingInformation: Array<{
      gapId: string;
      missing: string;
      impactOnChapter: string;
      requiredBeforeLock: boolean;
      suggestedSource: string;
    }> = [];
    for (const character of input.cast) {
      const hasProfile = input.psychProfiles.some((profile) => profile.name.toLowerCase() === character.toLowerCase());
      if (!hasProfile) {
        missingInformation.push({
          gapId: `GAP-PSY-${character.toLowerCase().replace(/\s+/g, "-")}`,
          missing: `Psych profile for ${character} (core fear + core desire).`,
          impactOnChapter: "Hidden-history motive precision stays generic and reduces pressure specificity.",
          requiredBeforeLock: false,
          suggestedSource: "person.characterCoreProfile in Prisma seed data",
        });
      }
    }
    const undatedEvidence = input.chapterEvidencePack.evidence.filter((item) => item.kind === "timeline_event" && item.inferredYear === null).length;
    if (undatedEvidence > 0) {
      missingInformation.push({
        gapId: "GAP-CHRONO-DATES",
        missing: `${undatedEvidence} timeline evidence rows lack explicit year tags <= 1680.`,
        impactOnChapter: "Chronology confidence remains probabilistic instead of explicit.",
        requiredBeforeLock: true,
        suggestedSource: "book1TimelineEvent.yearLabel/dateStart normalization",
      });
    }
    const hasSymbolicLayer = input.sceneComponents.some((component) => component.componentType === "symbolic_layer");
    if (!hasSymbolicLayer) {
      missingInformation.push({
        gapId: "GAP-SYMBOLIC-LAYER",
        missing: "Canonical symbolic-layer component for Chapter 1 scene stack.",
        impactOnChapter: "Recurring motif continuity into later arcs is less constrained.",
        requiredBeforeLock: false,
        suggestedSource: "book1SceneComponent with componentType=symbolic_layer",
      });
    }
    return ChapterGapReportSchema.parse({
      artifact: "chapter_gap_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      missingInformation,
    });
  }
}
