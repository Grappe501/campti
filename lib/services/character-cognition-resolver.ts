import { FactAssertionStatus } from "@prisma/client";

import { composeDeterministicCognitionLayer } from "@/lib/cognition/deterministic-cognition-compose";
import type { CharacterCognitionFrame, CharacterCore, CharacterState } from "@/lib/domain/cognition";
import {
  applyEnneagramShapingToResolvedCognition,
  buildEnneagramInnerVoicePattern,
  buildEnneagramProfileFromCore,
  derivePressureSignals,
  resolveEffectiveIntegrationState,
} from "@/lib/enneagram/enneagram-cognition-shaping";
import { getNineTypeKnowledge } from "@/lib/enneagram/nine-type-knowledge";
import { buildWorldStateThoughtStyle } from "@/lib/inner-voice/framing/world-state-thought-style";
import { loadWorldStateThoughtStyleSource } from "@/lib/inner-voice/load-world-state-thought-style-source";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveWorldStateForScene } from "@/lib/services/world-state-resolution";
import {
  computeCharacterAgeYears,
  inferApproximateStoryYearFromScene,
  resolveCharacterAgeBand,
} from "@/lib/inner-voice/framing/age-band";
import { getInstinctStackingCognitionDeltas } from "@/lib/enneagram/instinct-stacking";
import { buildCharacterThoughtLanguageProfile } from "@/lib/thought-language/character-thought-language-profile";
import { resolveThoughtLanguageFrame } from "@/lib/thought-language/resolve-thought-language-frame";
import { buildWorldStateLanguageEnvironment } from "@/lib/thought-language/world-state-language-environment";
import { buildCharacterPhysicalStateFromSources } from "@/lib/cognition/physical-state-from-sources";
import {
  applyEmbodimentToResolvedCognition,
  deriveEmbodiedEffectsFromState,
} from "@/lib/cognition/embodied-cognition-shaping";
import { buildCharacterDesireProfileFromCore } from "@/lib/cognition/character-desire-profile";
import { applyDesireShapingToCognitionFrame } from "@/lib/cognition/desire-cognition-shaping";
import { buildWorldStateDesireEnvironment } from "@/lib/cognition/world-state-desire-environment";
import { buildThoughtRealismProfiles } from "@/lib/cognition/thought-realism-profiles";
import type { ResolveCognitionFrameSimulationOptions } from "@/lib/domain/simulation-run";
import { applySimulationOverridesToRelationshipContext } from "@/lib/simulation/apply-simulation-overrides";
import { mergeCharacterStateSnapshot } from "@/lib/simulation/merge-character-state-snapshot";

/**
 * Loads core profile, scene snapshot, legacy simulation state, world state, relationships, and assertions,
 * then deterministically composes cognition + Enneagram shaping. No LLM.
 *
 * Future integration (not implemented here): PINNED cognition sessions and this frame may be merged into
 * `SceneGenerationInput` / inner-voice prompts; exploratory runs stay advisory. See project narrative docs.
 */
export async function resolveCharacterCognitionFrame(
  characterId: string,
  sceneId: string,
  simulation?: ResolveCognitionFrameSimulationOptions
): Promise<CharacterCognitionFrame> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      chapter: { include: { book: true } },
    },
  });

  const [person, literaryProfile, coreProfileRow, sceneSnapshotRow, legacyState, ws] =
    await Promise.all([
      prisma.person.findUniqueOrThrow({
        where: { id: characterId },
        select: { id: true, name: true, birthYear: true, deathYear: true },
      }),
      prisma.characterProfile.findUnique({
        where: { personId: characterId },
      }),
      cognitionPrisma.characterCoreProfile.findUnique({
        where: { characterId },
      }),
      cognitionPrisma.characterStateSnapshot.findFirst({
        where: {
          characterId,
          sceneId,
          snapshotKind: "CANONICAL_PLANNED",
        },
        orderBy: [{ sequenceIndex: "desc" }, { createdAt: "desc" }],
      }),
      prisma.characterState.findFirst({
        where: { personId: characterId, sceneId },
        orderBy: { updatedAt: "desc" },
      }),
      resolveEffectiveWorldStateForScene(sceneId),
    ]);

  let worldStateRow = ws.worldStateId
    ? await prisma.worldStateReference.findUnique({
        where: { id: ws.worldStateId },
      })
    : null;
  if (simulation?.patch?.worldStateReferenceId) {
    const forced = await prisma.worldStateReference.findUnique({
      where: { id: simulation.patch.worldStateReferenceId },
    });
    if (forced) {
      worldStateRow = forced;
    }
  }

  let rel = await prisma.characterRelationship.findMany({
    where: {
      OR: [{ personAId: characterId }, { personBId: characterId }],
    },
    take: 40,
  });
  if (simulation?.patch) {
    rel = applySimulationOverridesToRelationshipContext(characterId, rel, simulation.patch);
  }

  const assertions = await prisma.genealogicalAssertion.findMany({
    where: {
      status: FactAssertionStatus.ACTIVE,
      narrativePreferred: true,
      slot: { subjectType: "Person", subjectId: characterId },
    },
    include: { slot: { select: { slotLabel: true } } },
    take: 80,
  });

  let coreProfile = coreProfileRow as CharacterCore | null;
  if (coreProfile && simulation?.patch?.translationRenderMode) {
    coreProfile = { ...coreProfile, translationRenderMode: simulation.patch.translationRenderMode };
  }

  let stateSnapshot = mergeCharacterStateSnapshot(
    sceneSnapshotRow as CharacterState | null,
    simulation?.patch?.stateSnapshot
  );

  const resolvedBase = composeDeterministicCognitionLayer({
    personName: person.name,
    literaryProfile,
    coreProfile,
    state: stateSnapshot,
    legacySimulationState: legacyState
      ? {
          emotionalState: legacyState.emotionalState,
          motivation: legacyState.motivation,
          fearState: legacyState.fearState,
          socialConstraint: legacyState.socialConstraint,
          structuredDataJson: legacyState.structuredDataJson,
        }
      : null,
    effectiveWorldState: worldStateRow,
    scene: {
      id: scene.id,
      description: scene.description,
      summary: scene.summary,
      narrativeIntent: scene.narrativeIntent,
      emotionalTone: scene.emotionalTone,
      structuredDataJson: scene.structuredDataJson,
    },
    relationships: rel,
    relevantAssertions: assertions.map((a) => ({
      id: a.id,
      valueJson: a.valueJson,
      narrativePreferred: a.narrativePreferred,
      slot: a.slot ? { label: a.slot.slotLabel } : null,
    })),
  });

  const enneagramProfile = buildEnneagramProfileFromCore(coreProfile, literaryProfile);

  const storyYear =
    simulation?.patch?.approximateStoryYear ??
    inferApproximateStoryYearFromScene(scene.structuredDataJson, scene.historicalAnchor);
  const cognitionAgeYears = computeCharacterAgeYears({
    birthYear: person.birthYear,
    deathYear: person.deathYear,
    approximateStoryYear: storyYear,
  });
  const { band: cognitionAgeBand } = resolveCharacterAgeBand(cognitionAgeYears);

  const worldLanguageEnv = buildWorldStateLanguageEnvironment({
    worldStateId: worldStateRow?.id ?? null,
    eraId: worldStateRow?.eraId ?? null,
    label: worldStateRow?.label ?? null,
    /** Present in schema; regenerate Prisma client if missing from types. */
    languageEnvironmentJson: (worldStateRow as { languageEnvironmentJson?: unknown } | null)
      ?.languageEnvironmentJson,
  });
  const thoughtLangProfile = buildCharacterThoughtLanguageProfile(coreProfile, literaryProfile);
  const thoughtLanguageFrame = resolveThoughtLanguageFrame({
    character: thoughtLangProfile,
    world: worldLanguageEnv,
    ageBand: cognitionAgeBand,
    statusTags: [],
    sceneNarrativeIntent: scene.narrativeIntent,
  });

  const instinctCognition = getInstinctStackingCognitionDeltas(enneagramProfile.instinctStacking);

  let worldStyleForPressure = null;
  if (worldStateRow?.id) {
    const wsSrc = await loadWorldStateThoughtStyleSource(worldStateRow.id);
    worldStyleForPressure = buildWorldStateThoughtStyle(wsSrc);
  }

  const pressure = derivePressureSignals({
    worldStyle: worldStyleForPressure,
    stateFearText: stateSnapshot?.currentFear ?? null,
    stateAngerText: stateSnapshot?.currentAnger ?? null,
    stateSocialRiskText: stateSnapshot?.currentSocialRisk ?? null,
    stateHopeText: stateSnapshot?.currentHope ?? null,
    instinctStacking: enneagramProfile.instinctStacking,
  });

  const { stress, growth } = resolveEffectiveIntegrationState({
    primaryType: enneagramProfile.primaryType,
    baseline: enneagramProfile.baselineIntegrationLevel,
    pressure,
    ageBand: cognitionAgeBand,
  });

  const voice = buildEnneagramInnerVoicePattern({
    primaryType: enneagramProfile.primaryType,
    stress,
    growth,
  });
  const knowledge = getNineTypeKnowledge(enneagramProfile.primaryType);

  const shaped = applyEnneagramShapingToResolvedCognition(resolvedBase, {
    profile: enneagramProfile,
    stress,
    growth,
    voice,
    knowledge,
    instinct: instinctCognition,
  });

  let characterDesireBundle = buildCharacterDesireProfileFromCore(coreProfile, literaryProfile);
  if (simulation?.patch?.characterDesireProfile) {
    characterDesireBundle = {
      ...characterDesireBundle,
      desire: { ...characterDesireBundle.desire, ...simulation.patch.characterDesireProfile },
    };
  }
  if (simulation?.patch?.attachmentLonging) {
    characterDesireBundle = {
      ...characterDesireBundle,
      attachment: { ...characterDesireBundle.attachment, ...simulation.patch.attachmentLonging },
    };
  }

  let worldDesireEnvironment = buildWorldStateDesireEnvironment({
    worldStateId: worldStateRow?.id ?? null,
    eraId: worldStateRow?.eraId ?? null,
    label: worldStateRow?.label ?? null,
    desireEnvironmentJson: (worldStateRow as { desireEnvironmentJson?: unknown } | null)?.desireEnvironmentJson,
  });
  if (simulation?.patch?.worldDesireEnvironment) {
    worldDesireEnvironment = { ...worldDesireEnvironment, ...simulation.patch.worldDesireEnvironment };
  }

  const afterDesire = applyDesireShapingToCognitionFrame(shaped, {
    bundle: characterDesireBundle,
    coreProfile,
    stateSnapshot,
    worldDesire: worldDesireEnvironment,
    cognitionAgeBand,
    enneagramProfile,
    worldStyle: worldStyleForPressure,
  });

  let characterPhysicalState = buildCharacterPhysicalStateFromSources({
    legacySimulationState: legacyState,
    sceneStructuredDataJson: scene.structuredDataJson,
  });
  if (simulation?.patch?.embodiment) {
    characterPhysicalState = { ...characterPhysicalState, ...simulation.patch.embodiment };
  }
  const embodiedCognitionEffects = deriveEmbodiedEffectsFromState(characterPhysicalState);
  const embodiedResolved = applyEmbodimentToResolvedCognition(
    afterDesire.resolved,
    embodiedCognitionEffects,
    characterPhysicalState
  );

  const fearSalience = Math.min(
    1,
    embodiedResolved.fearStack.length * 0.11 + 0.14 + (stress.active ? stress.weight * 0.12 : 0)
  );

  const {
    thoughtFragmentProfile,
    cognitiveDistortionProfile,
    innerVoiceTextureProfile,
  } = buildThoughtRealismProfiles({
    cognitionAgeBand,
    embodiedCognitionEffects,
    characterPhysicalState,
    activeDesireSignals: afterDesire.desirePressureSummary.vectors,
    desirePressureSummary: afterDesire.desirePressureSummary,
    worldDesire: worldDesireEnvironment,
    enneagramProfile,
    effectiveStressState: stress,
    worldStyle: worldStyleForPressure,
    fearSalience,
  });

  return {
    characterId,
    sceneId,
    resolvedAtIso: new Date().toISOString(),
    person,
    literaryProfile,
    coreProfile,
    stateSnapshot,
    legacyCharacterState: legacyState,
    effectiveWorldState: worldStateRow,
    scene: {
      id: scene.id,
      description: scene.description,
      summary: scene.summary,
      narrativeIntent: scene.narrativeIntent,
      emotionalTone: scene.emotionalTone,
      structuredDataJson: scene.structuredDataJson,
      historicalAnchor: scene.historicalAnchor,
    },
    relationships: rel,
    relevantAssertions: assertions.map((a) => ({
      id: a.id,
      valueJson: a.valueJson,
      narrativePreferred: a.narrativePreferred,
      slot: a.slot ? { label: a.slot.slotLabel } : null,
    })),
    enneagramProfile,
    effectiveStressState: stress,
    effectiveGrowthState: growth,
    enneagramVoicePattern: voice,
    selfDeceptionPattern: afterDesire.selfDeceptionPattern,
    tabooThoughtPattern: afterDesire.tabooThoughtPattern,
    cognitionAgeBand,
    cognitionAgeYears,
    thoughtLanguageFrame,
    characterDesireProfile: characterDesireBundle.desire,
    pleasurePattern: characterDesireBundle.pleasure,
    attachmentLongingProfile: characterDesireBundle.attachment,
    sexualConstraintProfile: characterDesireBundle.sexual,
    activeDesireSignals: afterDesire.desirePressureSummary.vectors,
    worldDesireEnvironment,
    desirePressureSummary: afterDesire.desirePressureSummary,
    characterPhysicalState,
    embodiedCognitionEffects,
    thoughtFragmentProfile,
    cognitiveDistortionProfile,
    innerVoiceTextureProfile,
    ...embodiedResolved,
  };
}

/** JSON-safe bundle for prompts, tests, and future LLM contracts. */
export function cognitionFrameToPromptPayload(frame: CharacterCognitionFrame): Record<string, unknown> {
  return {
    contractVersion: "cognition-frame-v6",
    cognitionMeta: {
      ageBand: frame.cognitionAgeBand,
      ageYears: frame.cognitionAgeYears,
      instinctStacking: frame.enneagramProfile.instinctStacking,
    },
    characterId: frame.characterId,
    sceneId: frame.sceneId,
    resolvedAtIso: frame.resolvedAtIso,
    person: frame.person,
    literaryWorldview: frame.literaryProfile?.worldview ?? null,
    literaryFears: frame.literaryProfile?.fears ?? null,
    literaryDesires: frame.literaryProfile?.desires ?? null,
    coreProfile: frame.coreProfile,
    stateSnapshot: frame.stateSnapshot,
    enneagram: {
      profile: frame.enneagramProfile,
      effectiveStressState: frame.effectiveStressState,
      effectiveGrowthState: frame.effectiveGrowthState,
      voicePattern: frame.enneagramVoicePattern,
      selfDeceptionPattern: frame.selfDeceptionPattern,
      tabooThoughtPattern: frame.tabooThoughtPattern,
    },
    thoughtLanguage: frame.thoughtLanguageFrame,
    embodiment: {
      physicalState: frame.characterPhysicalState,
      effects: frame.embodiedCognitionEffects,
    },
    desire: {
      worldEnvironment: frame.worldDesireEnvironment,
      characterDesireProfile: frame.characterDesireProfile,
      pleasurePattern: frame.pleasurePattern,
      attachmentLongingProfile: frame.attachmentLongingProfile,
      sexualConstraintProfile: frame.sexualConstraintProfile,
      activeDesireSignals: frame.activeDesireSignals,
      pressureSummary: frame.desirePressureSummary,
    },
    realism: {
      thoughtFragment: frame.thoughtFragmentProfile,
      cognitiveDistortion: frame.cognitiveDistortionProfile,
      innerVoiceTexture: frame.innerVoiceTextureProfile,
    },
    resolved: {
      perceivedReality: frame.perceivedReality,
      activeMotives: frame.activeMotives,
      suppressedMotives: frame.suppressedMotives,
      fearStack: frame.fearStack,
      obligationStack: frame.obligationStack,
      identityConflict: frame.identityConflict,
      decisionBiases: frame.decisionBiases,
    },
    legacyCharacterState: frame.legacyCharacterState,
    worldState: frame.effectiveWorldState
      ? {
          id: frame.effectiveWorldState.id,
          eraId: frame.effectiveWorldState.eraId,
          label: frame.effectiveWorldState.label,
        }
      : null,
    scene: frame.scene,
    relationshipCount: frame.relationships.length,
    assertionCount: frame.relevantAssertions.length,
  };
}
