import { z } from "zod";

import {
  Book1CharacterConsoleGovernancePolicySchema,
  Book1CharacterConsoleTurnSchema,
  type Book1CharacterConsoleGovernancePolicy,
  type Book1CharacterConsoleTurn,
  type Book1CharacterMutationKind,
} from "@/lib/domain/book1-character-console";

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

const ChapterLawSourceSchema = z.object({
  artifact: z.literal("chapter_law"),
  chapter: z.literal(1),
  chronologyInvariants: z.array(z.object({ id: z.string(), rule: z.string(), enforcement: z.string() })),
  futureArcConstraints: z.array(z.object({ id: z.string(), mustPreserve: z.string(), forbiddenResolution: z.string() })),
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
      segment: z.number().int().positive(),
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

const EnneagramConsciousnessEngineSourceSchema = z.object({
  artifact: z.literal("chapter_enneagram_consciousness_engine"),
  chapter: z.literal(1),
  characters: z.array(
    z.object({
      character: z.string(),
      attentionEngine: z.object({
        noticesFirst: z.string(),
        ignores: z.string(),
        overFocusesOn: z.string(),
      }),
      distortionEngine: z.object({
        misinterpretsRealityAs: z.string(),
        coreNarrativeBias: z.string(),
      }),
      relationshipFieldBehavior: z.object({
        intimateBehavior: z.string(),
        kinshipRole: z.string(),
        powerWorkBehavior: z.string(),
        socialGroupBehavior: z.string(),
      }),
      languageImpact: z.object({
        sentenceStructure: z.string(),
        silenceVsSpeech: z.string(),
        emotionalExpression: z.string(),
        abstractionVsEmbodiment: z.string(),
      }),
    }),
  ),
});

const EnneagramOperatingLayerSourceSchema = z.object({
  artifact: z.literal("chapter_enneagram_operating_layer"),
  chapter: z.literal(1),
  characters: z.array(
    z.object({
      character: z.string(),
      enneagramType: z.string(),
      coreFear: z.string(),
      coreDesire: z.string(),
      defenseMechanism: z.string(),
      attentionFixation: z.string(),
      stressPattern: z.string(),
      securityPattern: z.string(),
      selfAwarenessLevel: z.string(),
      selfNarrationAccuracy: z.number(),
      whatTheyCannotAdmit: z.array(z.string()),
      howTheyMisreadOthers: z.string(),
    }),
  ),
});

const EnneagramMediationLayerSourceSchema = z.object({
  artifact: z.literal("chapter_enneagram_mediation_layer"),
  chapter: z.literal(1),
  characters: z.array(
    z.object({
      character: z.string(),
      perceptionBiasOutputs: z.array(z.string()),
      omissionPatterns: z.array(z.string()),
      misreadingPatterns: z.array(z.string()),
      bodilyStressConversions: z.array(z.string()),
      silencePatterns: z.array(z.string()),
      conflictResponsePatterns: z.array(z.string()),
      intimacyDistancePatterns: z.array(z.string()),
      authorityResponsePatterns: z.array(z.string()),
      ritualMeaningPatterns: z.array(z.string()),
    }),
  ),
});

const Book1CharacterConsoleSourceStateSchema = z.object({
  chapterCharacterHiddenHistories: ChapterCharacterHiddenHistoriesSourceSchema,
  chapterRelationshipPressureMap: ChapterRelationshipPressureMapSourceSchema,
  chapterLaw: ChapterLawSourceSchema,
  chapterEpicSimulation: ChapterEpicSimulationSourceSchema,
  chapterOutline: ChapterOutlineSourceSchema,
  chapterDraft: ChapterDraftSourceSchema,
  chapterEnneagramOperatingLayer: EnneagramOperatingLayerSourceSchema.optional(),
  chapterEnneagramConsciousnessEngine: EnneagramConsciousnessEngineSourceSchema.optional(),
  chapterEnneagramMediationLayer: EnneagramMediationLayerSourceSchema.optional(),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()).min(1),
    capturedAt: z.string(),
  }),
});
export type Book1CharacterConsoleSourceState = z.infer<typeof Book1CharacterConsoleSourceStateSchema>;

const Book1CharacterConsoleSelectionSchema = z.object({
  chapter: z.literal(1),
  scene: z.number().int().positive(),
  character: z.string().min(1),
});
export type Book1CharacterConsoleSelection = z.infer<typeof Book1CharacterConsoleSelectionSchema>;

const CharacterConsoleSimulationPacketSchema = z.object({
  chapter: z.literal(1),
  scene: z.number().int().positive(),
  character: z.string(),
  canonicalIdentity: z.object({
    character: z.string(),
    publicRole: z.string(),
    chapter: z.literal(1),
    scene: z.number().int().positive(),
    sceneFocus: z.string(),
  }),
  hiddenHistoryRelevantToChapter: z.array(z.string()),
  relationshipPressureState: z.array(
    z.object({
      relation: z.string(),
      pressureType: z.string(),
      intensity: z.number(),
      chapterSignal: z.string(),
      futureArcTrigger: z.string(),
    }),
  ),
  presentEmotionalState: z.object({
    label: z.string(),
    drivers: z.array(z.string()),
  }),
  knownFacts: z.array(z.string()),
  falseBeliefs: z.array(z.string()),
  consciousnessResponseProfile: z
    .object({
      noticesFirst: z.string(),
      ignores: z.string(),
      overFocusesOn: z.string(),
      misinterpretsRealityAs: z.string(),
      narrativeBias: z.string(),
      silenceVsSpeech: z.string(),
      emotionalExpression: z.string(),
      abstractionVsEmbodiment: z.string(),
      intimateBehavior: z.string(),
      kinshipRole: z.string(),
      powerWorkBehavior: z.string(),
      socialGroupBehavior: z.string(),
    })
    .optional(),
  rawEnneagramOperatingLayer: z
    .object({
      enneagramType: z.string(),
      coreFear: z.string(),
      coreDesire: z.string(),
      defenseMechanism: z.string(),
      attentionFixation: z.string(),
      stressPattern: z.string(),
      securityPattern: z.string(),
      selfAwarenessLevel: z.string(),
      selfNarrationAccuracy: z.number(),
      whatTheyCannotAdmit: z.array(z.string()),
      howTheyMisreadOthers: z.string(),
    })
    .optional(),
  mediatedBehavioralLayer: z
    .object({
      perceptionBiasOutputs: z.array(z.string()),
      omissionPatterns: z.array(z.string()),
      misreadingPatterns: z.array(z.string()),
      bodilyStressConversions: z.array(z.string()),
      silencePatterns: z.array(z.string()),
      conflictResponsePatterns: z.array(z.string()),
      intimacyDistancePatterns: z.array(z.string()),
      authorityResponsePatterns: z.array(z.string()),
      ritualMeaningPatterns: z.array(z.string()),
    })
    .optional(),
  currentChapterLawConstraints: z.array(
    z.object({
      id: z.string(),
      constraint: z.string(),
      enforcement: z.string().optional(),
    }),
  ),
  currentSceneLawConstraints: z.array(
    z.object({
      id: z.string(),
      constraint: z.string(),
    }),
  ),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});
type CharacterConsoleSimulationPacket = z.infer<typeof CharacterConsoleSimulationPacketSchema>;

const DownstreamImpactSchema = z.object({
  scenes: z.array(z.string()),
  characters: z.array(z.string()),
  constraints: z.array(z.string()),
  themes: z.array(z.string()),
});
type DownstreamImpact = z.infer<typeof DownstreamImpactSchema>;

const TurnEvaluationSchema = z.object({
  turnId: z.string(),
  actionType: z.string(),
  accepted: z.boolean(),
  reason: z.string(),
  responseMode: z.literal("out_of_world_author_console"),
  mutationEvaluation: z
    .object({
      mutationId: z.string(),
      mutationKind: z.string(),
      allowed: z.boolean(),
      sandboxApplied: z.boolean(),
      canonicalApplied: z.boolean(),
      downstreamImpact: DownstreamImpactSchema,
    })
    .optional(),
  provenance: z.object({
    requestedBy: z.string(),
    requestedAt: z.string(),
    refs: z.array(z.string()),
  }),
});
type TurnEvaluation = z.infer<typeof TurnEvaluationSchema>;

const Book1CharacterConsoleSessionArtifactSchema = z.object({
  artifact: z.literal("book1_character_console_session"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  scene: z.number(),
  character: z.string(),
  generatedAt: z.string(),
  governancePolicy: Book1CharacterConsoleGovernancePolicySchema,
  simulationPacket: CharacterConsoleSimulationPacketSchema,
  turns: z.array(Book1CharacterConsoleTurnSchema),
  evaluations: z.array(TurnEvaluationSchema),
  branchSandbox: z.object({
    sandboxId: z.string(),
    simulatedMutations: z.array(
      z.object({
        mutationId: z.string(),
        mutationKind: z.string(),
        targetKey: z.string(),
        patch: z.record(z.string(), z.unknown()),
        appliedAt: z.string(),
      }),
    ),
    canonicalMutations: z.array(
      z.object({
        mutationId: z.string(),
        targetKey: z.string(),
        approvedAt: z.string(),
      }),
    ),
  }),
  canonicalStateProtected: z.boolean(),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
    capturedAt: z.string(),
  }),
});
export type Book1CharacterConsoleSessionArtifact = z.infer<typeof Book1CharacterConsoleSessionArtifactSchema>;

const Book1CharacterConsoleImpactReportSchema = z.object({
  artifact: z.literal("book1_character_console_impact_report"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  scene: z.number(),
  character: z.string(),
  generatedAt: z.string(),
  simulationMode: z.enum(["observer", "god"]),
  interventionTotals: z.object({
    submitted: z.number(),
    allowed: z.number(),
    denied: z.number(),
    sandboxApplied: z.number(),
    canonicalApplied: z.number(),
  }),
  interventions: z.array(
    z.object({
      turnId: z.string(),
      mutationId: z.string(),
      mutationKind: z.string(),
      allowed: z.boolean(),
      sandboxApplied: z.boolean(),
      canonicalApplied: z.boolean(),
      downstreamImpact: DownstreamImpactSchema,
    }),
  ),
  impactedSurfaceSummary: DownstreamImpactSchema,
  branchIsolation: z.object({
    sandboxId: z.string(),
    canonicalStateMutated: z.boolean(),
    approvedMutationIds: z.array(z.string()),
  }),
  provenanceRetained: z.boolean(),
  recommendations: z.array(z.string()),
});
export type Book1CharacterConsoleImpactReport = z.infer<typeof Book1CharacterConsoleImpactReportSchema>;

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function computeEmotionLabel(averageIntensity: number): string {
  if (averageIntensity >= 0.8) return "acute_strain";
  if (averageIntensity >= 0.6) return "guarded_alertness";
  if (averageIntensity >= 0.4) return "contained_tension";
  return "steady_vigilance";
}

function buildSceneLawConstraints(input: {
  scene: number;
  sceneOutline: z.infer<typeof ChapterOutlineSourceSchema>["timeline"][number];
  sceneDraft?: z.infer<typeof ChapterDraftSourceSchema>["segments"][number];
}) {
  const rows = [
    {
      id: `SL-${input.scene}-focus`,
      constraint: `Preserve scene focus: ${input.sceneOutline.sceneFocus}`,
    },
    {
      id: `SL-${input.scene}-foreshadowing`,
      constraint: `Preserve foreshadowing continuity: ${input.sceneOutline.foreshadowing}`,
    },
    {
      id: `SL-${input.scene}-handoff`,
      constraint: `Preserve transition handoff: ${input.sceneOutline.transitionToNext}`,
    },
  ];
  if (input.sceneDraft) {
    rows.push({
      id: `SL-${input.scene}-objective`,
      constraint: `Preserve segment objective: ${input.sceneDraft.objective}`,
    });
  }
  return rows;
}

function mutationAllowedByPolicy(input: {
  governancePolicy: Book1CharacterConsoleGovernancePolicy;
  mutationKind: Book1CharacterMutationKind;
}): boolean {
  if (input.mutationKind === "character_state") return input.governancePolicy.allowCharacterStateMutation;
  if (input.mutationKind === "dialogue") return input.governancePolicy.allowDialogueMutation;
  if (input.mutationKind === "action_path") return input.governancePolicy.allowActionPathMutation;
  if (input.mutationKind === "anchor") return input.governancePolicy.allowAnchorMutation;
  return false;
}

function impactFromMutation(input: {
  selection: Book1CharacterConsoleSelection;
  packet: CharacterConsoleSimulationPacket;
  mutationKind: Book1CharacterMutationKind;
}): DownstreamImpact {
  const relatedCharacters = input.packet.relationshipPressureState
    .map((relation) => relation.relation)
    .flatMap((relation) => relation.split(" -> "))
    .filter((name) => name !== input.selection.character);
  const themesByMutationKind: Record<Book1CharacterMutationKind, string[]> = {
    character_state: ["identity", "faith"],
    dialogue: ["faith", "power"],
    action_path: ["survival", "power"],
    anchor: ["continuity", "identity"],
  };
  return {
    scenes: [`chapter1-scene-${String(input.selection.scene).padStart(2, "0")}`],
    characters: unique([input.selection.character, ...relatedCharacters]).slice(0, 4),
    constraints: unique(
      input.packet.currentSceneLawConstraints.map((row) => row.id).concat(input.packet.currentChapterLawConstraints.map((row) => row.id)),
    ),
    themes: themesByMutationKind[input.mutationKind],
  };
}

export class Book1CharacterConsoleService {
  runSession(input: {
    sourceState: Book1CharacterConsoleSourceState;
    selection: Book1CharacterConsoleSelection;
    governancePolicy: Book1CharacterConsoleGovernancePolicy;
    turns: Book1CharacterConsoleTurn[];
    approvedMutationIds?: string[];
    sandboxId?: string;
  }): {
    session: Book1CharacterConsoleSessionArtifact;
    impactReport: Book1CharacterConsoleImpactReport;
  } {
    const generatedAt = new Date().toISOString();
    const sourceState = Book1CharacterConsoleSourceStateSchema.parse(input.sourceState);
    const selection = Book1CharacterConsoleSelectionSchema.parse(input.selection);
    const governancePolicy = Book1CharacterConsoleGovernancePolicySchema.parse(input.governancePolicy);
    const turns = z.array(Book1CharacterConsoleTurnSchema).parse(input.turns);
    const approvedMutationIds = new Set(input.approvedMutationIds ?? []);
    const sandboxId = input.sandboxId ?? `book1-character-console-${generatedAt.replace(/[:.]/g, "-")}`;

    const characterState = sourceState.chapterCharacterHiddenHistories.characters.find(
      (row) => row.character.toLowerCase() === selection.character.toLowerCase(),
    );
    if (!characterState) {
      throw new Error(`Character ${selection.character} is not present in Chapter 1 hidden history state.`);
    }

    const sceneOutline = sourceState.chapterOutline.timeline.find((row) => row.segment === selection.scene);
    if (!sceneOutline) {
      throw new Error(`Scene ${selection.scene} is not present in Chapter 1 outline timeline.`);
    }
    const sceneDraft = sourceState.chapterDraft.segments.find((row) => row.segment === selection.scene);

    const relevantHiddenBeats = sourceState.chapterEpicSimulation.hiddenTimeline.filter((beat) =>
      beat.actors.some((actor) => actor.toLowerCase() === characterState.character.toLowerCase()),
    );
    const relationshipPressureState = sourceState.chapterRelationshipPressureMap.relationships
      .filter(
        (row) =>
          row.from.toLowerCase() === characterState.character.toLowerCase() ||
          row.to.toLowerCase() === characterState.character.toLowerCase(),
      )
      .map((row) => ({
        relation: `${row.from} -> ${row.to}`,
        pressureType: row.pressureType,
        intensity: row.intensity,
        chapterSignal: row.chapterSignal,
        futureArcTrigger: row.futureArcTrigger,
      }));
    const intensityAverage =
      relationshipPressureState.length > 0
        ? relationshipPressureState.reduce((sum, row) => sum + row.intensity, 0) / relationshipPressureState.length
        : 0.35;
    const chapterLawConstraints = sourceState.chapterLaw.chronologyInvariants
      .map((row) => ({ id: row.id, constraint: row.rule, enforcement: row.enforcement }))
      .concat(
        sourceState.chapterLaw.futureArcConstraints.map((row) => ({
          id: row.id,
          constraint: `${row.mustPreserve} | Forbidden: ${row.forbiddenResolution}`,
        })),
      );
    const sceneLawConstraints = buildSceneLawConstraints({
      scene: selection.scene,
      sceneOutline,
      sceneDraft,
    });
    const consciousnessProfile = sourceState.chapterEnneagramConsciousnessEngine?.characters.find(
      (row) => row.character.toLowerCase() === characterState.character.toLowerCase(),
    );
    const operatingProfile = sourceState.chapterEnneagramOperatingLayer?.characters.find(
      (row) => row.character.toLowerCase() === characterState.character.toLowerCase(),
    );
    const mediationProfile = sourceState.chapterEnneagramMediationLayer?.characters.find(
      (row) => row.character.toLowerCase() === characterState.character.toLowerCase(),
    );

    const packet = CharacterConsoleSimulationPacketSchema.parse({
      chapter: 1,
      scene: selection.scene,
      character: characterState.character,
      canonicalIdentity: {
        character: characterState.character,
        publicRole: characterState.publicRole,
        chapter: 1,
        scene: selection.scene,
        sceneFocus: sceneOutline.sceneFocus,
      },
      hiddenHistoryRelevantToChapter: relevantHiddenBeats
        .map((beat) => `${beat.beatId}: ${beat.latentEvent}`)
        .concat(characterState.futureArcHooks.map((hook) => `hook: ${hook}`)),
      relationshipPressureState,
      presentEmotionalState: {
        label: computeEmotionLabel(intensityAverage),
        drivers: unique(
          relationshipPressureState.map((row) => row.pressureType).concat([
            `private_wound:${characterState.privateWound}`,
            `suppressed_motive:${characterState.suppressedMotive}`,
          ]),
        ),
      },
      knownFacts: unique(
        chapterLawConstraints.map((row) => row.constraint).concat(relationshipPressureState.map((row) => row.chapterSignal)),
      ),
      falseBeliefs: [
        `${characterState.character} assumes disclosing private fear will collapse kinship credibility.`,
        `${characterState.character} overestimates short-term stability of current social hierarchy.`,
      ],
      consciousnessResponseProfile: consciousnessProfile
        ? {
            noticesFirst: consciousnessProfile.attentionEngine.noticesFirst,
            ignores: consciousnessProfile.attentionEngine.ignores,
            overFocusesOn: consciousnessProfile.attentionEngine.overFocusesOn,
            misinterpretsRealityAs: consciousnessProfile.distortionEngine.misinterpretsRealityAs,
            narrativeBias: consciousnessProfile.distortionEngine.coreNarrativeBias,
            silenceVsSpeech: consciousnessProfile.languageImpact.silenceVsSpeech,
            emotionalExpression: consciousnessProfile.languageImpact.emotionalExpression,
            abstractionVsEmbodiment: consciousnessProfile.languageImpact.abstractionVsEmbodiment,
            intimateBehavior: consciousnessProfile.relationshipFieldBehavior.intimateBehavior,
            kinshipRole: consciousnessProfile.relationshipFieldBehavior.kinshipRole,
            powerWorkBehavior: consciousnessProfile.relationshipFieldBehavior.powerWorkBehavior,
            socialGroupBehavior: consciousnessProfile.relationshipFieldBehavior.socialGroupBehavior,
          }
        : undefined,
      rawEnneagramOperatingLayer: operatingProfile
        ? {
            enneagramType: operatingProfile.enneagramType,
            coreFear: operatingProfile.coreFear,
            coreDesire: operatingProfile.coreDesire,
            defenseMechanism: operatingProfile.defenseMechanism,
            attentionFixation: operatingProfile.attentionFixation,
            stressPattern: operatingProfile.stressPattern,
            securityPattern: operatingProfile.securityPattern,
            selfAwarenessLevel: operatingProfile.selfAwarenessLevel,
            selfNarrationAccuracy: operatingProfile.selfNarrationAccuracy,
            whatTheyCannotAdmit: operatingProfile.whatTheyCannotAdmit,
            howTheyMisreadOthers: operatingProfile.howTheyMisreadOthers,
          }
        : undefined,
      mediatedBehavioralLayer: mediationProfile
        ? {
            perceptionBiasOutputs: mediationProfile.perceptionBiasOutputs,
            omissionPatterns: mediationProfile.omissionPatterns,
            misreadingPatterns: mediationProfile.misreadingPatterns,
            bodilyStressConversions: mediationProfile.bodilyStressConversions,
            silencePatterns: mediationProfile.silencePatterns,
            conflictResponsePatterns: mediationProfile.conflictResponsePatterns,
            intimacyDistancePatterns: mediationProfile.intimacyDistancePatterns,
            authorityResponsePatterns: mediationProfile.authorityResponsePatterns,
            ritualMeaningPatterns: mediationProfile.ritualMeaningPatterns,
          }
        : undefined,
      currentChapterLawConstraints: chapterLawConstraints,
      currentSceneLawConstraints: sceneLawConstraints,
      provenance: {
        sourceArtifacts: sourceState.provenance.sourceArtifacts,
      },
    });

    const simulatedMutations: Book1CharacterConsoleSessionArtifact["branchSandbox"]["simulatedMutations"] = [];
    const canonicalMutations: Book1CharacterConsoleSessionArtifact["branchSandbox"]["canonicalMutations"] = [];

    const evaluations: TurnEvaluation[] = turns.map((turn) => {
      const scopeMatchesSelection =
        turn.chapter === selection.chapter &&
        turn.scene === selection.scene &&
        turn.character.toLowerCase() === selection.character.toLowerCase();
      if (!scopeMatchesSelection) {
        return {
          turnId: turn.turnId,
          actionType: turn.actionType,
          accepted: false,
          reason: "Turn scope does not match selected chapter/scene/character packet.",
          responseMode: "out_of_world_author_console",
          provenance: {
            requestedBy: turn.requestedBy,
            requestedAt: turn.requestedAt,
            refs: unique(turn.provenanceRefs),
          },
        };
      }

      if (governancePolicy.simulationMode === "observer" && turn.actionType === "intervene") {
        return {
          turnId: turn.turnId,
          actionType: turn.actionType,
          accepted: false,
          reason: "Observer mode permits question/probe only; interventions are blocked.",
          responseMode: "out_of_world_author_console",
          provenance: {
            requestedBy: turn.requestedBy,
            requestedAt: turn.requestedAt,
            refs: unique(turn.provenanceRefs),
          },
        };
      }

      if (turn.actionType !== "intervene") {
        return {
          turnId: turn.turnId,
          actionType: turn.actionType,
          accepted: true,
          reason: "Accepted as out-of-world author exchange with no canonical mutation.",
          responseMode: "out_of_world_author_console",
          provenance: {
            requestedBy: turn.requestedBy,
            requestedAt: turn.requestedAt,
            refs: unique(turn.provenanceRefs),
          },
        };
      }

      if (!turn.proposedMutation) {
        return {
          turnId: turn.turnId,
          actionType: turn.actionType,
          accepted: false,
          reason: "Intervention requests must include a governed mutation proposal.",
          responseMode: "out_of_world_author_console",
          provenance: {
            requestedBy: turn.requestedBy,
            requestedAt: turn.requestedAt,
            refs: unique(turn.provenanceRefs),
          },
        };
      }

      const modeAllowsIntervention = governancePolicy.simulationMode === "god";
      const toggleAllowsMutation = mutationAllowedByPolicy({
        governancePolicy,
        mutationKind: turn.proposedMutation.mutationKind,
      });
      const allowed = modeAllowsIntervention && toggleAllowsMutation;
      const sandboxApplied = allowed;
      const canonicalApplied = allowed && approvedMutationIds.has(turn.proposedMutation.mutationId);
      const downstreamImpact = impactFromMutation({
        selection,
        packet,
        mutationKind: turn.proposedMutation.mutationKind,
      });

      if (sandboxApplied) {
        simulatedMutations.push({
          mutationId: turn.proposedMutation.mutationId,
          mutationKind: turn.proposedMutation.mutationKind,
          targetKey: turn.proposedMutation.targetKey,
          patch: turn.proposedMutation.patch,
          appliedAt: generatedAt,
        });
      }
      if (canonicalApplied) {
        canonicalMutations.push({
          mutationId: turn.proposedMutation.mutationId,
          targetKey: turn.proposedMutation.targetKey,
          approvedAt: generatedAt,
        });
      }

      const reason = !modeAllowsIntervention
        ? "Intervention denied: god mode is required."
        : !toggleAllowsMutation
          ? `Intervention denied by governance toggle for mutation kind ${turn.proposedMutation.mutationKind}.`
          : canonicalApplied
            ? "Intervention allowed and promoted from sandbox to canonical state by explicit approval."
            : "Intervention allowed in sandbox. Canonical state unchanged pending explicit approval.";
      const consciousnessCue = packet.consciousnessResponseProfile
        ? ` Response profile routes through ${packet.consciousnessResponseProfile.noticesFirst.toLowerCase()}, with silence mode ${packet.consciousnessResponseProfile.silenceVsSpeech.toLowerCase()}.`
        : "";

      return {
        turnId: turn.turnId,
        actionType: turn.actionType,
        accepted: allowed,
        reason: `${reason}${consciousnessCue}`,
        responseMode: "out_of_world_author_console",
        mutationEvaluation: {
          mutationId: turn.proposedMutation.mutationId,
          mutationKind: turn.proposedMutation.mutationKind,
          allowed,
          sandboxApplied,
          canonicalApplied,
          downstreamImpact,
        },
        provenance: {
          requestedBy: turn.requestedBy,
          requestedAt: turn.requestedAt,
          refs: unique(turn.provenanceRefs.concat(turn.proposedMutation.provenanceRefs)),
        },
      };
    });

    const interventionEvals = evaluations.filter((row) => row.mutationEvaluation);
    const impactRows = interventionEvals.map((row) => row.mutationEvaluation!);
    const impactedSurfaceSummary = {
      scenes: unique(impactRows.flatMap((row) => row.downstreamImpact.scenes)),
      characters: unique(impactRows.flatMap((row) => row.downstreamImpact.characters)),
      constraints: unique(impactRows.flatMap((row) => row.downstreamImpact.constraints)),
      themes: unique(impactRows.flatMap((row) => row.downstreamImpact.themes)),
    };

    const session = Book1CharacterConsoleSessionArtifactSchema.parse({
      artifact: "book1_character_console_session",
      schemaVersion: "1.0.0",
      chapter: 1,
      scene: selection.scene,
      character: selection.character,
      generatedAt,
      governancePolicy,
      simulationPacket: packet,
      turns,
      evaluations,
      branchSandbox: {
        sandboxId,
        simulatedMutations,
        canonicalMutations,
      },
      canonicalStateProtected: canonicalMutations.length === 0,
      provenance: sourceState.provenance,
    });

    const impactReport = Book1CharacterConsoleImpactReportSchema.parse({
      artifact: "book1_character_console_impact_report",
      schemaVersion: "1.0.0",
      chapter: 1,
      scene: selection.scene,
      character: selection.character,
      generatedAt,
      simulationMode: governancePolicy.simulationMode,
      interventionTotals: {
        submitted: interventionEvals.length,
        allowed: impactRows.filter((row) => row.allowed).length,
        denied: impactRows.filter((row) => !row.allowed).length,
        sandboxApplied: impactRows.filter((row) => row.sandboxApplied).length,
        canonicalApplied: impactRows.filter((row) => row.canonicalApplied).length,
      },
      interventions: interventionEvals.map((row) => ({
        turnId: row.turnId,
        mutationId: row.mutationEvaluation!.mutationId,
        mutationKind: row.mutationEvaluation!.mutationKind,
        allowed: row.mutationEvaluation!.allowed,
        sandboxApplied: row.mutationEvaluation!.sandboxApplied,
        canonicalApplied: row.mutationEvaluation!.canonicalApplied,
        downstreamImpact: row.mutationEvaluation!.downstreamImpact,
      })),
      impactedSurfaceSummary,
      branchIsolation: {
        sandboxId,
        canonicalStateMutated: canonicalMutations.length > 0,
        approvedMutationIds: canonicalMutations.map((row) => row.mutationId),
      },
      provenanceRetained: session.evaluations.every((row) => row.provenance.refs.length > 0 || row.actionType !== "intervene"),
      recommendations: [
        "Run Chapter 1 scene integrity and anchor guard checks before promoting any sandbox mutation to canon.",
        "Keep observer mode as default for exploratory author probes; only switch to god mode for governed interventions.",
        "Require explicit approval ledger entries for every canonical mutation id to preserve provenance.",
      ],
    });

    return { session, impactReport };
  }
}
