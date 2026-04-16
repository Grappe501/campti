import { z } from "zod";

import {
  Book1LawConsoleActionSchema,
  Book1LawConsoleGovernancePolicySchema,
  type Book1LawConsoleAction,
  type Book1LawConsoleActionType,
  type Book1LawConsoleGovernancePolicy,
} from "@/lib/domain/book1-law-console";

const ChapterLawSourceSchema = z.object({
  artifact: z.literal("chapter_law"),
  chapter: z.literal(1),
  chronologyInvariants: z.array(z.object({ id: z.string(), rule: z.string(), enforcement: z.string() })),
  futureArcConstraints: z.array(z.object({ id: z.string(), mustPreserve: z.string(), forbiddenResolution: z.string() })),
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

const ChapterOutlineSourceSchema = z.object({
  chapter: z.literal(1),
  timeline: z.array(
    z.object({
      segment: z.number(),
      sceneFocus: z.string(),
      setting: z.string(),
      characters: z.array(z.string()),
      psychology: z.string(),
      narrativePurpose: z.string(),
      readerExperience: z.string(),
      foreshadowing: z.string(),
      historicalContext: z.string(),
      transitionToNext: z.string(),
    }),
  ),
});

const ChapterDraftSourceSchema = z.object({
  artifact: z.literal("chapter_draft"),
  chapter: z.literal(1),
  segments: z.array(
    z.object({
      segment: z.number().int().positive(),
      objective: z.string(),
      text: z.string(),
      evidenceRefs: z.array(z.string()),
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

const Book1LawConsoleSourceStateSchema = z.object({
  chapterLaw: ChapterLawSourceSchema,
  chapterVoiceSpec: ChapterVoiceSpecSourceSchema,
  chapterEpicSimulation: ChapterEpicSimulationSourceSchema,
  chapterOutline: ChapterOutlineSourceSchema,
  chapterDraft: ChapterDraftSourceSchema,
  chapterCharacterHiddenHistories: ChapterCharacterHiddenHistoriesSourceSchema,
  provenance: z.object({
    sourceArtifacts: z.array(z.string()).min(1),
    capturedAt: z.string(),
  }),
});
export type Book1LawConsoleSourceState = z.infer<typeof Book1LawConsoleSourceStateSchema>;

const CanonRiskSchema = z.enum(["low", "moderate", "high", "critical"]);
type CanonRisk = z.infer<typeof CanonRiskSchema>;

const SimulatedDraftBehaviorSchema = z.object({
  proseSignalShift: z.array(z.string()),
  expectedSceneEffect: z.array(
    z.object({
      scene: z.string(),
      behaviorDelta: z.string(),
    }),
  ),
  foreshadowingContractDelta: z.array(
    z.object({
      contractId: z.string(),
      impact: z.string(),
    }),
  ),
});
type SimulatedDraftBehavior = z.infer<typeof SimulatedDraftBehaviorSchema>;

const AffectedSurfaceSchema = z.object({
  scenes: z.array(z.string()),
  characters: z.array(z.string()),
  themes: z.array(z.string()),
  futureForeshadowingContracts: z.array(z.string()),
});
type AffectedSurface = z.infer<typeof AffectedSurfaceSchema>;

const ActionEvaluationSchema = z.object({
  actionId: z.string(),
  actionType: z.string(),
  targetKey: z.string(),
  allowed: z.boolean(),
  reason: z.string(),
  sandboxApplied: z.boolean(),
  canonicalApplied: z.boolean(),
  lockedAnchorViolation: z.boolean(),
  canonRisk: CanonRiskSchema,
  affected: AffectedSurfaceSchema,
  simulatedDraftBehavior: SimulatedDraftBehaviorSchema,
  provenance: z.object({
    requestedBy: z.string(),
    requestedAt: z.string(),
    refs: z.array(z.string()),
    policyMode: z.string(),
  }),
});
type ActionEvaluation = z.infer<typeof ActionEvaluationSchema>;

const Book1LawConsoleSessionArtifactSchema = z.object({
  artifact: z.literal("book1_law_console_session"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  governancePolicy: Book1LawConsoleGovernancePolicySchema,
  sourceStateProvenance: z.object({
    sourceArtifacts: z.array(z.string()),
    capturedAt: z.string(),
  }),
  actions: z.array(Book1LawConsoleActionSchema),
  evaluations: z.array(ActionEvaluationSchema),
  branchSandbox: z.object({
    sandboxId: z.string(),
    simulatedPatches: z.array(
      z.object({
        actionId: z.string(),
        actionType: z.string(),
        targetKey: z.string(),
        patch: z.record(z.string(), z.unknown()),
        appliedAt: z.string(),
      }),
    ),
    canonicalMutations: z.array(
      z.object({
        actionId: z.string(),
        approvedAt: z.string(),
      }),
    ),
  }),
  canonicalStateProtected: z.boolean(),
});
export type Book1LawConsoleSessionArtifact = z.infer<typeof Book1LawConsoleSessionArtifactSchema>;

const Book1LawConsoleImpactReportSchema = z.object({
  artifact: z.literal("book1_law_console_impact_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  simulationMode: z.string(),
  actionTotals: z.object({
    submitted: z.number(),
    allowed: z.number(),
    denied: z.number(),
    sandboxApplied: z.number(),
    canonicalApplied: z.number(),
  }),
  lockViolations: z.object({
    anchorViolations: z.number(),
    violatingActionIds: z.array(z.string()),
  }),
  affectedSurfaceSummary: AffectedSurfaceSchema,
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
    sandboxId: z.string(),
    canonicalStateMutated: z.boolean(),
    approvedActionIds: z.array(z.string()),
  }),
  readabilityNotes: z.array(z.string()),
  provenanceRetained: z.boolean(),
});
export type Book1LawConsoleImpactReport = z.infer<typeof Book1LawConsoleImpactReportSchema>;

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function allowsActionByMode(simulationMode: Book1LawConsoleGovernancePolicy["simulationMode"], actionType: Book1LawConsoleActionType): boolean {
  if (simulationMode === "locked_canon") return actionType === "adjust_symbolic_emphasis";
  if (simulationMode === "soft_law") return actionType !== "propose_anchor_mutation";
  if (simulationMode === "counterfactual") return actionType !== "propose_anchor_mutation";
  return true;
}

function allowsActionByToggle(policy: Book1LawConsoleGovernancePolicy, actionType: Book1LawConsoleActionType): boolean {
  if (actionType === "adjust_foreshadowing_intensity") return policy.allowForeshadowingRetune && policy.allowChapterLawMutation;
  if (actionType === "propose_anchor_mutation") return policy.allowAnchorMutation && policy.allowChapterLawMutation;
  if (
    actionType === "change_reveal_imply_balance" ||
    actionType === "change_emotional_residue_target" ||
    actionType === "alter_chapter_end_hook_intensity" ||
    actionType === "shift_scene_weighting"
  ) {
    return policy.allowChapterLawMutation && policy.allowVoiceSpecTuning;
  }
  return policy.allowChapterLawMutation;
}

function detectThemes(action: Book1LawConsoleAction): string[] {
  const lower = `${action.actionType} ${action.targetKey} ${action.rationale}`.toLowerCase();
  const byText = ["power", "identity", "faith", "survival", "continuity"].filter((theme) => lower.includes(theme));
  if (byText.length > 0) return unique(byText);
  if (action.actionType === "adjust_foreshadowing_intensity" || action.actionType === "alter_chapter_end_hook_intensity") {
    return ["survival", "faith"];
  }
  if (action.actionType === "change_reveal_imply_balance") return ["identity", "power"];
  return ["continuity", "identity"];
}

function inferCanonRisk(input: {
  actionType: Book1LawConsoleActionType;
  allowed: boolean;
  lockedAnchorViolation: boolean;
  canonicalApplied: boolean;
}): CanonRisk {
  if (input.lockedAnchorViolation) return "critical";
  if (!input.allowed) return "low";
  if (input.actionType === "propose_anchor_mutation") return input.canonicalApplied ? "critical" : "high";
  if (input.actionType === "adjust_foreshadowing_intensity" || input.actionType === "alter_chapter_end_hook_intensity") return "high";
  if (input.actionType === "change_reveal_imply_balance" || input.actionType === "shift_scene_weighting") return "moderate";
  return "low";
}

function summarizeAffectedSurface(input: {
  action: Book1LawConsoleAction;
  sourceState: Book1LawConsoleSourceState;
}): AffectedSurface {
  const allScenes = input.sourceState.chapterOutline.timeline.map((row) => `chapter1-scene-${String(row.segment).padStart(2, "0")}`);
  const targetSceneMatches = input.sourceState.chapterOutline.timeline
    .filter((row) => `${input.action.targetKey} ${input.action.rationale}`.toLowerCase().includes(`scene ${row.segment}`))
    .map((row) => `chapter1-scene-${String(row.segment).padStart(2, "0")}`);
  const scenes = targetSceneMatches.length > 0 ? targetSceneMatches : allScenes.slice(0, 4);

  const cast = unique(
    input.sourceState.chapterOutline.timeline.flatMap((row) => row.characters).concat(
      input.sourceState.chapterCharacterHiddenHistories.characters.map((row) => row.character),
    ),
  );
  const targetedCharacters = cast.filter((name) =>
    `${input.action.targetKey} ${input.action.rationale}`.toLowerCase().includes(name.toLowerCase()),
  );

  const contracts = input.sourceState.chapterLaw.futureArcConstraints.map((row) => `${row.id}: ${row.mustPreserve}`);
  const narrowedContracts = input.action.actionType === "adjust_foreshadowing_intensity" ? contracts : contracts.slice(0, 1);

  return {
    scenes,
    characters: targetedCharacters.length > 0 ? targetedCharacters : cast.slice(0, 4),
    themes: detectThemes(input.action),
    futureForeshadowingContracts: narrowedContracts,
  };
}

function simulateDraftBehavior(input: {
  action: Book1LawConsoleAction;
  affected: AffectedSurface;
}): SimulatedDraftBehavior {
  const sceneEffect = input.affected.scenes.map((scene) => ({
    scene,
    behaviorDelta: `${input.action.actionType} changes narrative emphasis at ${scene} via target ${input.action.targetKey}.`,
  }));
  const proseSignalShiftByActionType: Record<Book1LawConsoleActionType, string[]> = {
    adjust_symbolic_emphasis: ["Increase motif lexical repetition", "Prioritize symbolic callbacks in sentence endings"],
    adjust_foreshadowing_intensity: ["Raise unresolved future pressure markers", "Increase long-arc hint frequency in segment transitions"],
    change_reveal_imply_balance: ["Shift explicit statements toward implication ratio", "Limit direct exposition density"],
    strengthen_ritual_visibility: ["Increase ritual verb visibility", "Expand witness language around ceremony"],
    weaken_ritual_visibility: ["Compress ritual references into subtext", "Reduce direct ceremonial naming"],
    change_emotional_residue_target: ["Retarget closing emotion signature", "Adjust cadence toward selected residue"],
    alter_chapter_end_hook_intensity: ["Retune chapter-final uncertainty amplitude", "Raise handoff compulsion to next chapter"],
    shift_scene_weighting: ["Rebalance observer/setting/environment narrative allocation", "Retune descriptive distribution by scene"],
    propose_anchor_mutation: ["Mutate hidden-timeline anchor linkage cues", "Re-map cause/effect references around anchor"],
  };
  const contractDelta = input.affected.futureForeshadowingContracts.map((contract) => ({
    contractId: contract.split(":")[0] ?? contract,
    impact: `Potentially retuned by ${input.action.actionType} for ${input.action.targetKey}.`,
  }));

  return {
    proseSignalShift: proseSignalShiftByActionType[input.action.actionType],
    expectedSceneEffect: sceneEffect,
    foreshadowingContractDelta: contractDelta,
  };
}

export class Book1LawConsoleService {
  runSession(input: {
    sourceState: Book1LawConsoleSourceState;
    governancePolicy: Book1LawConsoleGovernancePolicy;
    actions: Book1LawConsoleAction[];
    approvedActionIds?: string[];
    sandboxId?: string;
  }): {
    session: Book1LawConsoleSessionArtifact;
    impactReport: Book1LawConsoleImpactReport;
  } {
    const generatedAt = new Date().toISOString();
    const sourceState = Book1LawConsoleSourceStateSchema.parse(input.sourceState);
    const governancePolicy = Book1LawConsoleGovernancePolicySchema.parse(input.governancePolicy);
    const actions = z.array(Book1LawConsoleActionSchema).parse(input.actions);
    const approvedActionIds = new Set(input.approvedActionIds ?? []);
    const sandboxId = input.sandboxId ?? `book1-law-console-${generatedAt.replace(/[:.]/g, "-")}`;
    const lockedAnchorSet = new Set(sourceState.chapterEpicSimulation.hiddenTimeline.map((beat) => beat.beatId));

    const simulatedPatches: Book1LawConsoleSessionArtifact["branchSandbox"]["simulatedPatches"] = [];
    const canonicalMutations: Book1LawConsoleSessionArtifact["branchSandbox"]["canonicalMutations"] = [];

    const evaluations: ActionEvaluation[] = actions.map((action) => {
      const modeAllowed = allowsActionByMode(governancePolicy.simulationMode, action.actionType);
      const toggleAllowed = allowsActionByToggle(governancePolicy, action.actionType);
      const allowed = modeAllowed && toggleAllowed;

      const isAnchorAction = action.actionType === "propose_anchor_mutation";
      const referencesLockedAnchor = isAnchorAction && lockedAnchorSet.has(action.targetKey);
      const lockedAnchorViolation = referencesLockedAnchor && !allowed;

      const sandboxApplied = allowed;
      const canonicalApplied = sandboxApplied && approvedActionIds.has(action.actionId);
      if (sandboxApplied) {
        simulatedPatches.push({
          actionId: action.actionId,
          actionType: action.actionType,
          targetKey: action.targetKey,
          patch: action.patch,
          appliedAt: generatedAt,
        });
      }
      if (canonicalApplied) {
        canonicalMutations.push({
          actionId: action.actionId,
          approvedAt: generatedAt,
        });
      }

      const affected = summarizeAffectedSurface({ action, sourceState });
      const simulatedDraftBehavior = simulateDraftBehavior({ action, affected });
      const reason = !modeAllowed
        ? `Action ${action.actionType} is disallowed in simulationMode ${governancePolicy.simulationMode}.`
        : !toggleAllowed
          ? `Action ${action.actionType} blocked by governance toggles.`
          : canonicalApplied
            ? "Action allowed in sandbox and promoted to canonical by explicit approval."
            : "Action allowed in sandbox only; canonical state remains unchanged.";
      const canonRisk = inferCanonRisk({
        actionType: action.actionType,
        allowed,
        lockedAnchorViolation,
        canonicalApplied,
      });

      return ActionEvaluationSchema.parse({
        actionId: action.actionId,
        actionType: action.actionType,
        targetKey: action.targetKey,
        allowed,
        reason,
        sandboxApplied,
        canonicalApplied,
        lockedAnchorViolation,
        canonRisk,
        affected,
        simulatedDraftBehavior,
        provenance: {
          requestedBy: action.requestedBy,
          requestedAt: action.requestedAt,
          refs: action.provenanceRefs,
          policyMode: governancePolicy.simulationMode,
        },
      });
    });

    const session = Book1LawConsoleSessionArtifactSchema.parse({
      artifact: "book1_law_console_session",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      governancePolicy,
      sourceStateProvenance: sourceState.provenance,
      actions,
      evaluations,
      branchSandbox: {
        sandboxId,
        simulatedPatches,
        canonicalMutations,
      },
      canonicalStateProtected: canonicalMutations.length === 0,
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

    const impactReport = Book1LawConsoleImpactReportSchema.parse({
      artifact: "book1_law_console_impact_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      simulationMode: governancePolicy.simulationMode,
      actionTotals: {
        submitted: evaluations.length,
        allowed: evaluations.filter((row) => row.allowed).length,
        denied: evaluations.filter((row) => !row.allowed).length,
        sandboxApplied: evaluations.filter((row) => row.sandboxApplied).length,
        canonicalApplied: evaluations.filter((row) => row.canonicalApplied).length,
      },
      lockViolations: {
        anchorViolations: evaluations.filter((row) => row.lockedAnchorViolation).length,
        violatingActionIds: evaluations.filter((row) => row.lockedAnchorViolation).map((row) => row.actionId),
      },
      affectedSurfaceSummary: {
        scenes: unique(evaluations.flatMap((row) => row.affected.scenes)),
        characters: unique(evaluations.flatMap((row) => row.affected.characters)),
        themes: unique(evaluations.flatMap((row) => row.affected.themes)),
        futureForeshadowingContracts: unique(evaluations.flatMap((row) => row.affected.futureForeshadowingContracts)),
      },
      canonRiskSummary: {
        highest,
        histogram: riskHistogram,
      },
      branchIsolation: {
        sandboxId,
        canonicalStateMutated: canonicalMutations.length > 0,
        approvedActionIds: canonicalMutations.map((row) => row.actionId),
      },
      readabilityNotes: [
        "Each action includes simulatedDraftBehavior with prose and scene-level effects.",
        "FutureForeshadowingContracts explicitly list impacted chapter-law constraints.",
        "Locked-anchor violations are elevated separately from generic governance denials.",
      ],
      provenanceRetained: evaluations.every((row) => row.provenance.refs.length > 0),
    });

    return { session, impactReport };
  }
}
