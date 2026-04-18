import { loadSceneGenerationInput } from "@/lib/services/scene-generation-input-loader";
import { prepareCanonicalPreGenerationBundleForScene } from "@/lib/services/scene-generation-governance-input-adapter";
import { HumanGravityRuntimeDerivationService } from "@/lib/services/human-gravity-runtime-derivation-service";
import {
  loadPersistedCharacterSimulationProfilesForPersonIds,
  summarizeCharacterSimulationProfileTruth,
} from "@/lib/services/character-simulation-author-bundle-load-service";
import { CharacterSimulationRuntimeDerivationService } from "@/lib/services/character-simulation-runtime-service";
import type { AuthorCommandCockpitBundle } from "@/lib/domain/author-command-cockpit";

/**
 * Admin / inspection: assemble the same canonical slices as production scene generation (no model call).
 */
export async function buildCharacterSimulationCockpitPanelForScene(
  sceneId: string
): Promise<NonNullable<AuthorCommandCockpitBundle["characterSimulation"]> | null> {
  const [genInput, pre] = await Promise.all([
    loadSceneGenerationInput(sceneId, {}, { includeSocialFieldGeneration: false }),
    prepareCanonicalPreGenerationBundleForScene(sceneId),
  ]);
  let merged = { ...genInput, canonicalPreGeneration: pre };
  merged = {
    ...merged,
    humanGravityRuntime: new HumanGravityRuntimeDerivationService().deriveFromSceneGenerationInput(merged),
  };
  const personIds = merged.contract.participatingPeople.map((p) => p.id);
  const persistedMap = await loadPersistedCharacterSimulationProfilesForPersonIds(personIds);
  merged = {
    ...merged,
    persistedCharacterSimulationProfiles: Object.keys(persistedMap).length ? persistedMap : null,
  };
  const profileTruth = summarizeCharacterSimulationProfileTruth(personIds, persistedMap);
  const rt = new CharacterSimulationRuntimeDerivationService().derive(merged);
  if (!rt) return null;

  return {
    sceneId: rt.sceneId,
    chapterId: rt.chapterId,
    scenePurposeFromPressure: rt.sceneEmergenceDigest.scenePurposeFromPressure,
    necessityPreview: rt.sceneEmergenceDigest.sceneNecessityReasons.slice(0, 5),
    conflictPreview: rt.sceneEmergenceDigest.conflictSources.slice(0, 5),
    cognitiveSnapshot: rt.cognitiveStates.map((c) => ({
      characterId: c.characterId,
      fear: c.currentFearActivation,
      decisionPressure: c.currentDecisionPressure,
      identityStress: c.currentIdentityStress,
      desireFocus: c.currentDesireFocus.slice(0, 120),
      internalConflict: c.currentInternalConflict.slice(0, 120),
    })),
    relationshipSnapshot: rt.relationshipStates.map((r) => ({
      relationshipId: r.relationshipId,
      tension: r.currentTensionLevel,
      threat: r.currentThreatLevel,
      mode: r.currentConflictMode,
      repair: r.currentRepairStatus,
    })),
    voiceSnapshot: rt.voiceStates.map((v) => ({
      characterId: v.characterId,
      mode: v.currentVoiceMode,
      stress: v.stressLevel,
      truthVsMask: v.truthVsMaskRatio,
    })),
    constraintFlags: rt.constraintFlags.slice(0, 12),
    evolution: rt.evolutionStamp,
    authorNudgeHints: [
      "Desire/fear deltas: characterSimulationAuthorNudge on SceneGenerationInput (API path).",
      "Relationship tension: relationshipTensionDeltaByPairKey sorted pair id.",
      "Voice stress: voiceStressBoostByCharacter map.",
      "Persisted mind/voice: CharacterSimulationAuthorBundle per Person (Cluster 9); seed is fallback only.",
    ],
    profileTruth,
  };
}
