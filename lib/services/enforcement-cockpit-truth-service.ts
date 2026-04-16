import type {
  CockpitEnforcementPanelTruth,
  CockpitEnforcementSemanticTruth,
} from "@/lib/domain/author-command-cockpit";
import { COCKPIT_ENFORCEMENT_SEMANTIC_TRUTH_VERSION } from "@/lib/domain/author-command-cockpit";
import { buildEnforcementRegistry, evaluateReadinessEvidenceTrustRecord } from "@/lib/services/enforcement-registry-service";

/** Maps `AuthorCommandCockpitBundle` optional panel fields → enforcement registry subsystem ids. */
export const AUTHOR_COCKPIT_PANEL_TO_SUBSYSTEM: Record<string, string> = {
  beatAssembly: "beat_assembly_chain",
  chapterState: "chapter_state",
  narrativePsychology: "narrative_psychology",
  proseConstraints: "prose_generation_constraints",
  beatGating: "regeneration_beat_gating",
  narrativeThreads: "narrative_threads",
  chapterComposition: "chapter_composition",
  sequenceArchitecture: "sequence_architecture",
  sceneGeneration: "scene_generation_engine_bundle",
  literaryDevices: "literary_device_controls",
  epicContinuity: "epic_narrative_continuity_encs",
  emotionalGravity: "epic_emotional_gravity_eegs",
  narratorPresence: "narrator_presence_convergence",
};

export type AuthorCockpitPanelPresenceInput = {
  beatAssembly?: unknown;
  chapterState?: unknown;
  narrativePsychology?: unknown;
  proseConstraints?: unknown;
  beatGating?: unknown;
  narrativeThreads?: unknown;
  chapterComposition?: unknown;
  sequenceArchitecture?: unknown;
  sceneGeneration?: unknown;
  literaryDevices?: unknown;
  epicContinuity?: unknown;
  emotionalGravity?: unknown;
  narratorPresence?: unknown;
};

export function collectPopulatedAuthorCockpitPanelKeys(
  input: AuthorCockpitPanelPresenceInput
): string[] {
  const keys: string[] = [];
  if (input.beatAssembly !== undefined) keys.push("beatAssembly");
  if (input.chapterState !== undefined) keys.push("chapterState");
  if (input.narrativePsychology !== undefined) keys.push("narrativePsychology");
  if (input.proseConstraints !== undefined) keys.push("proseConstraints");
  if (input.beatGating !== undefined) keys.push("beatGating");
  if (input.narrativeThreads !== undefined) keys.push("narrativeThreads");
  if (input.chapterComposition !== undefined) keys.push("chapterComposition");
  if (input.sequenceArchitecture !== undefined) keys.push("sequenceArchitecture");
  if (input.sceneGeneration !== undefined) keys.push("sceneGeneration");
  if (input.literaryDevices !== undefined) keys.push("literaryDevices");
  if (input.epicContinuity !== undefined) keys.push("epicContinuity");
  if (input.emotionalGravity !== undefined) keys.push("emotionalGravity");
  if (input.narratorPresence !== undefined) keys.push("narratorPresence");
  return keys;
}

export function buildCockpitEnforcementSemanticTruth(input: {
  runtimeId: string;
  populatedPanelKeys: string[];
}): CockpitEnforcementSemanticTruth {
  const registry = buildEnforcementRegistry();
  const globalWarnings: string[] = [];
  if (input.runtimeId !== registry.canonicalRuntimeId) {
    globalWarnings.push(
      `cockpit_runtime_non_canonical: ${input.runtimeId} (canonical=${registry.canonicalRuntimeId})`
    );
  }

  const panelTruth: CockpitEnforcementPanelTruth[] = [];
  for (const key of input.populatedPanelKeys) {
    const subsystemId = AUTHOR_COCKPIT_PANEL_TO_SUBSYSTEM[key];
    if (!subsystemId) continue;
    const decl = registry.subsystemDeclarations.find((s) => s.subsystemId === subsystemId);
    if (!decl) continue;
    const trust = evaluateReadinessEvidenceTrustRecord(decl);
    panelTruth.push({
      panelKey: key,
      subsystemId: decl.subsystemId,
      enforcementClass: decl.enforcementClass,
      participatesInCanonicalRuntime: decl.participatesInCanonicalRuntime,
      affectsCanonicalOutput: decl.affectsCanonicalOutput,
      canBlockInvalidExecution: decl.canBlockInvalidExecution,
      demoSafeStatus: decl.demoSafeStatus,
      deterministicOrSampleSeeded: decl.deterministicOrSampleSeeded,
      observationalOnly: true,
      readinessEvidenceTrustClass: trust.trustClass,
      mayCountAsAuthoritativeProductionReadinessEvidence: trust.mayCountAsAuthoritativeProductionReadinessEvidence,
      readinessTrustAllowanceRuleId: trust.readinessTrustAllowanceRuleId,
    });
    if (decl.deterministicOrSampleSeeded !== "neither") {
      globalWarnings.push(`panel_${key}_deterministic_or_sample_seeded`);
    }
    if (decl.demoSafeStatus === "non_demo_safe") {
      globalWarnings.push(`panel_${key}_non_demo_safe`);
    }
  }

  return {
    contractVersion: COCKPIT_ENFORCEMENT_SEMANTIC_TRUTH_VERSION,
    canonicalRuntimeId: registry.canonicalRuntimeId,
    cockpitRuntimeId: input.runtimeId,
    cockpitBundleObservationalOnly: true,
    panelTruth,
    globalWarnings,
    ambiguousSubsystemReferences: registry.ambiguousSubsystems,
  };
}
