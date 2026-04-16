import { z } from "zod";

import {
  Book1AuthorActionSchema,
  Book1AuthorSimulationGovernancePolicySchema,
  type Book1AuthorAction,
  type Book1AuthorActionType,
  type Book1AuthorSimulationGovernancePolicy,
  type Book1SimulationMode,
} from "@/lib/domain/book1-author-cockpit-simulation";

const ChapterEpicSimulationSourceSchema = z.object({
  artifact: z.literal("chapter_epic_simulation"),
  chapter: z.literal(1),
  hiddenTimeline: z.array(
    z.object({
      beatId: z.string(),
      sequence: z.number(),
      latentEvent: z.string(),
      actors: z.array(z.string()),
      pressureVectors: z.array(z.string()),
      chapterSurfaceSignal: z.string(),
      futureArcConstraintLink: z.string(),
    }),
  ),
});

const ChapterLawSourceSchema = z.object({
  artifact: z.literal("chapter_law"),
  chapter: z.literal(1),
  chronologyInvariants: z.array(z.object({ id: z.string(), rule: z.string(), enforcement: z.string() })),
  futureArcConstraints: z.array(z.object({ id: z.string(), mustPreserve: z.string(), forbiddenResolution: z.string() })),
});

const ChapterRelationshipPressureMapSourceSchema = z.object({
  artifact: z.literal("chapter_relationship_pressure_map"),
  chapter: z.literal(1),
  relationships: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      pressureType: z.string(),
      intensity: z.number(),
      chapterSignal: z.string(),
      futureArcTrigger: z.string(),
    }),
  ),
});

const ChapterCharacterHiddenHistoriesSourceSchema = z.object({
  artifact: z.literal("chapter_character_hidden_histories"),
  chapter: z.literal(1),
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

const ChapterVoiceSpecSourceSchema = z.object({
  artifact: z.literal("chapter_voice_spec"),
  chapter: z.literal(1),
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
});

const Chapter1CanonicalSourceStateSchema = z.object({
  chapterEpicSimulation: ChapterEpicSimulationSourceSchema,
  chapterLaw: ChapterLawSourceSchema,
  chapterRelationshipPressureMap: ChapterRelationshipPressureMapSourceSchema,
  chapterCharacterHiddenHistories: ChapterCharacterHiddenHistoriesSourceSchema,
  chapterVoiceSpec: ChapterVoiceSpecSourceSchema,
  provenance: z.object({
    sourceArtifacts: z.array(z.string()).min(1),
    capturedAt: z.string(),
  }),
});

const CanonRiskSchema = z.enum(["low", "moderate", "high", "critical"]);
type CanonRisk = z.infer<typeof CanonRiskSchema>;

const ActionEvaluationSchema = z.object({
  actionId: z.string(),
  actionType: z.string(),
  targetKey: z.string(),
  allowed: z.boolean(),
  reason: z.string(),
  changedBranchState: z.boolean(),
  branchOnly: z.boolean(),
  affected: z.object({
    chapters: z.array(z.number()),
    scenes: z.array(z.string()),
    characters: z.array(z.string()),
    themes: z.array(z.string()),
  }),
  lockedAnchorViolation: z.boolean(),
  canonRisk: CanonRiskSchema,
  provenance: z.object({
    requestedBy: z.string(),
    requestedAt: z.string(),
    policyMode: z.string(),
    sourceArtifacts: z.array(z.string()),
  }),
});
type ActionEvaluation = z.infer<typeof ActionEvaluationSchema>;

const BranchSandboxPatchSchema = z.object({
  actionId: z.string(),
  actionType: z.string(),
  targetKey: z.string(),
  patch: z.record(z.string(), z.unknown()),
  appliedAt: z.string(),
});

const Book1AuthorCockpitSimulationArtifactSchema = z.object({
  artifact: z.literal("book1_author_cockpit_simulation"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  governancePolicy: Book1AuthorSimulationGovernancePolicySchema,
  canonicalStateProtected: z.boolean(),
  sourceStateProvenance: z.object({
    sourceArtifacts: z.array(z.string()),
    capturedAt: z.string(),
  }),
  actions: z.array(Book1AuthorActionSchema),
  evaluations: z.array(ActionEvaluationSchema),
  branchSandbox: z.object({
    branchId: z.string(),
    mode: z.string(),
    mutatesCanonicalState: z.boolean(),
    patches: z.array(BranchSandboxPatchSchema),
  }),
});
export type Book1AuthorCockpitSimulationArtifact = z.infer<typeof Book1AuthorCockpitSimulationArtifactSchema>;

const Book1AuthorCockpitImpactReportSchema = z.object({
  artifact: z.literal("book1_author_cockpit_impact_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  governanceMode: z.string(),
  actionTotals: z.object({
    submitted: z.number(),
    allowed: z.number(),
    denied: z.number(),
    appliedToBranch: z.number(),
  }),
  lockViolations: z.object({
    anchorViolations: z.number(),
    violatingActionIds: z.array(z.string()),
  }),
  affectedSurfaceSummary: z.object({
    chapters: z.array(z.number()),
    scenes: z.array(z.string()),
    characters: z.array(z.string()),
    themes: z.array(z.string()),
  }),
  canonRiskSummary: z.object({
    highest: CanonRiskSchema,
    histogram: z.object({
      low: z.number(),
      moderate: z.number(),
      high: z.number(),
      critical: z.number(),
    }),
  }),
  branchIsolation: z.object({
    canonicalStateMutated: z.boolean(),
    branchSandboxId: z.string(),
    provenanceRetained: z.boolean(),
  }),
  recommendations: z.array(z.string()),
});
export type Book1AuthorCockpitImpactReport = z.infer<typeof Book1AuthorCockpitImpactReportSchema>;

export type Chapter1CanonicalSourceState = z.infer<typeof Chapter1CanonicalSourceStateSchema>;

const ALL_THEME_TOKENS = ["power", "identity", "faith", "survival"];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function extractFutureChapterHints(chapterLaw: Chapter1CanonicalSourceState["chapterLaw"]): number[] {
  const text = chapterLaw.futureArcConstraints.map((row) => row.mustPreserve).join(" ");
  const matches = text.match(/\b([2-9]|1\d)\s*:/g) ?? [];
  const chapters = matches
    .map((match) => Number.parseInt(match.replace(":", "").trim(), 10))
    .filter((value) => Number.isFinite(value));
  return unique([1, ...chapters]).sort((a, b) => a - b);
}

function detectActionThemes(action: Book1AuthorAction): string[] {
  const lower = `${action.actionType} ${action.targetKey} ${action.rationale}`.toLowerCase();
  const dynamic = ALL_THEME_TOKENS.filter((theme) => lower.includes(theme));
  if (dynamic.length > 0) return unique(dynamic);
  if (action.actionType === "change_relationship_pressure") return ["power", "identity"];
  if (action.actionType === "change_psychological_weighting") return ["identity", "faith"];
  if (action.actionType === "retune_foreshadowing") return ["survival", "faith"];
  return ["power"];
}

function chooseCanonRisk(input: {
  allowed: boolean;
  actionType: Book1AuthorActionType;
  mode: Book1SimulationMode;
  lockedAnchorViolation: boolean;
}): CanonRisk {
  if (input.lockedAnchorViolation) return "critical";
  if (!input.allowed) return "low";
  if (input.mode === "unlocked_branch" && input.actionType === "propose_anchor_mutation") return "high";
  if (input.actionType === "update_chapter_law" || input.actionType === "mutate_timeline") return "high";
  if (input.actionType === "change_relationship_pressure" || input.actionType === "change_psychological_weighting") return "moderate";
  return "low";
}

function allowsActionByMode(mode: Book1SimulationMode, actionType: Book1AuthorActionType): boolean {
  if (mode === "locked_canon") return actionType === "adjust_symbolic_emphasis";
  if (mode === "soft_law") return actionType !== "propose_anchor_mutation" && actionType !== "mutate_timeline";
  if (mode === "counterfactual") return actionType !== "propose_anchor_mutation";
  return true;
}

function allowsActionByToggle(policy: Book1AuthorSimulationGovernancePolicy, actionType: Book1AuthorActionType): boolean {
  if (actionType === "propose_anchor_mutation") return policy.allowAnchorMutation;
  if (actionType === "update_chapter_law") return policy.allowChapterLawMutation;
  if (actionType === "change_psychological_weighting") return policy.allowCharacterPsychologyTuning;
  if (actionType === "retune_foreshadowing") return policy.allowForeshadowingRetune;
  if (actionType === "mutate_timeline") return policy.allowTimelineMutation;
  if (actionType === "change_relationship_pressure") return policy.allowRelationshipPressureRetune;
  if (actionType === "tune_voice_spec") return policy.allowVoiceSpecTuning;
  return true;
}

function summarizeAffectedSurface(input: {
  action: Book1AuthorAction;
  sourceState: Chapter1CanonicalSourceState;
}): ActionEvaluation["affected"] {
  const castFromRelationships = input.sourceState.chapterRelationshipPressureMap.relationships.flatMap((row) => [row.from, row.to]);
  const castFromPsychology = input.sourceState.chapterCharacterHiddenHistories.characters.map((row) => row.character);
  const allCharacters = unique(castFromRelationships.concat(castFromPsychology));
  const chapterHints = extractFutureChapterHints(input.sourceState.chapterLaw);
  const baselineScenes = ["book1-scene-01"];
  const hiddenTimelineScenes = input.sourceState.chapterEpicSimulation.hiddenTimeline.map((beat) => `chapter1-${beat.beatId.toLowerCase()}`);
  const chapters =
    input.action.actionType === "update_chapter_law" || input.action.actionType === "mutate_timeline"
      ? chapterHints
      : [1];
  const scenes = unique(baselineScenes.concat(hiddenTimelineScenes));

  let targetedCharacters = allCharacters.filter((name) => input.action.rationale.toLowerCase().includes(name.toLowerCase()));
  if (targetedCharacters.length === 0 && input.action.actionType === "change_relationship_pressure") {
    const [left, right] = compact(input.action.targetKey).split("->").map((token) => compact(token));
    targetedCharacters = allCharacters.filter((name) => name === left || name === right);
  }
  if (targetedCharacters.length === 0 && input.action.actionType === "change_psychological_weighting") {
    targetedCharacters = allCharacters.filter((name) => input.action.targetKey.toLowerCase().includes(name.toLowerCase()));
  }
  if (targetedCharacters.length === 0) targetedCharacters = allCharacters.slice(0, 2);

  return {
    chapters,
    scenes,
    characters: unique(targetedCharacters),
    themes: detectActionThemes(input.action),
  };
}

function buildDenialReason(input: {
  modeAllowed: boolean;
  toggleAllowed: boolean;
  mode: Book1SimulationMode;
  actionType: Book1AuthorActionType;
}): string {
  if (!input.modeAllowed) return `Action ${input.actionType} is disallowed in mode ${input.mode}.`;
  return `Action ${input.actionType} is disabled by governance toggle policy.`;
}

export class Book1AuthorCockpitSimulationService {
  run(input: {
    sourceState: Chapter1CanonicalSourceState;
    governancePolicy: Book1AuthorSimulationGovernancePolicy;
    actions: Book1AuthorAction[];
    branchId?: string;
  }): {
    simulation: Book1AuthorCockpitSimulationArtifact;
    impactReport: Book1AuthorCockpitImpactReport;
  } {
    const generatedAt = new Date().toISOString();
    const sourceState = Chapter1CanonicalSourceStateSchema.parse(input.sourceState);
    const governancePolicy = Book1AuthorSimulationGovernancePolicySchema.parse(input.governancePolicy);
    const actions = z.array(Book1AuthorActionSchema).parse(input.actions);
    const branchId = input.branchId ?? `book1-author-sim-${generatedAt.replace(/[:.]/g, "-")}`;

    const lockedAnchorSet = new Set(sourceState.chapterEpicSimulation.hiddenTimeline.map((beat) => beat.beatId));
    const mutatesCanonicalState = governancePolicy.simulationMode === "unlocked_branch";
    const canonicalStateProtected = !mutatesCanonicalState;
    const branchPatches: z.infer<typeof BranchSandboxPatchSchema>[] = [];

    const evaluations: ActionEvaluation[] = actions.map((action) => {
      const modeAllowed = allowsActionByMode(governancePolicy.simulationMode, action.actionType);
      const toggleAllowed = allowsActionByToggle(governancePolicy, action.actionType);
      const allowed = modeAllowed && toggleAllowed;
      const lockedAnchorViolation =
        action.actionType === "propose_anchor_mutation" && lockedAnchorSet.has(action.targetKey) && !allowed;
      const affected = summarizeAffectedSurface({ action, sourceState });
      const canonRisk = chooseCanonRisk({
        allowed,
        actionType: action.actionType,
        mode: governancePolicy.simulationMode,
        lockedAnchorViolation,
      });
      const changedBranchState = allowed;
      const branchOnly = true;

      if (changedBranchState) {
        branchPatches.push({
          actionId: action.actionId,
          actionType: action.actionType,
          targetKey: action.targetKey,
          patch: action.patch,
          appliedAt: generatedAt,
        });
      }

      return ActionEvaluationSchema.parse({
        actionId: action.actionId,
        actionType: action.actionType,
        targetKey: action.targetKey,
        allowed,
        reason: allowed
          ? `Allowed by ${governancePolicy.simulationMode} policy and toggle matrix.`
          : buildDenialReason({
              modeAllowed,
              toggleAllowed,
              mode: governancePolicy.simulationMode,
              actionType: action.actionType,
            }),
        changedBranchState,
        branchOnly,
        affected,
        lockedAnchorViolation,
        canonRisk,
        provenance: {
          requestedBy: action.requestedBy,
          requestedAt: action.requestedAt,
          policyMode: governancePolicy.simulationMode,
          sourceArtifacts: sourceState.provenance.sourceArtifacts,
        },
      });
    });

    const simulation = Book1AuthorCockpitSimulationArtifactSchema.parse({
      artifact: "book1_author_cockpit_simulation",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      governancePolicy,
      canonicalStateProtected,
      sourceStateProvenance: sourceState.provenance,
      actions,
      evaluations,
      branchSandbox: {
        branchId,
        mode: governancePolicy.simulationMode,
        mutatesCanonicalState,
        patches: branchPatches,
      },
    });

    const riskHistogram = {
      low: evaluations.filter((row) => row.canonRisk === "low").length,
      moderate: evaluations.filter((row) => row.canonRisk === "moderate").length,
      high: evaluations.filter((row) => row.canonRisk === "high").length,
      critical: evaluations.filter((row) => row.canonRisk === "critical").length,
    };
    const riskRank: CanonRisk[] = ["low", "moderate", "high", "critical"];
    const highest = evaluations
      .map((row) => row.canonRisk)
      .reduce<CanonRisk>((best, current) => (riskRank.indexOf(current) > riskRank.indexOf(best) ? current : best), "low");

    const impactReport = Book1AuthorCockpitImpactReportSchema.parse({
      artifact: "book1_author_cockpit_impact_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      governanceMode: governancePolicy.simulationMode,
      actionTotals: {
        submitted: evaluations.length,
        allowed: evaluations.filter((row) => row.allowed).length,
        denied: evaluations.filter((row) => !row.allowed).length,
        appliedToBranch: evaluations.filter((row) => row.changedBranchState).length,
      },
      lockViolations: {
        anchorViolations: evaluations.filter((row) => row.lockedAnchorViolation).length,
        violatingActionIds: evaluations.filter((row) => row.lockedAnchorViolation).map((row) => row.actionId),
      },
      affectedSurfaceSummary: {
        chapters: unique(evaluations.flatMap((row) => row.affected.chapters)).sort((a, b) => a - b),
        scenes: unique(evaluations.flatMap((row) => row.affected.scenes)),
        characters: unique(evaluations.flatMap((row) => row.affected.characters)),
        themes: unique(evaluations.flatMap((row) => row.affected.themes)),
      },
      canonRiskSummary: {
        highest,
        histogram: riskHistogram,
      },
      branchIsolation: {
        canonicalStateMutated: false,
        branchSandboxId: simulation.branchSandbox.branchId,
        provenanceRetained: simulation.evaluations.every((row) => row.provenance.sourceArtifacts.length > 0),
      },
      recommendations: [
        "Keep chapter1 anchor edits blocked unless simulationMode is unlocked_branch and anchor governance is explicitly enabled.",
        "Treat chapter law and timeline mutations as high-risk and require manual review before propagating beyond sandbox.",
        "Use affectedSurfaceSummary to schedule downstream re-validation for impacted chapters and cast relationships.",
      ],
    });

    return { simulation, impactReport };
  }
}
