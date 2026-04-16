import {
  NarratorPresenceValidationResultSchema,
  type CamptiNarratorPresencePack,
  type NarratorPresenceValidationResult,
  type NarratorValidationIssue,
} from "@/lib/domain/narrator-presence";

const PRESENCE_ORDER = [
  "invisible",
  "subtle",
  "guiding",
  "interpretive",
  "reflective",
  "personal",
  "intimate",
  "first_person",
] as const;

function issue(
  severity: NarratorValidationIssue["severity"],
  category: string,
  message: string,
  suggestedRepair: string,
): NarratorValidationIssue {
  return { severity, category, message, suggestedRepair };
}

export class NarratorPresenceValidationService {
  validatePack(pack: CamptiNarratorPresencePack): NarratorPresenceValidationResult {
    const hard: NarratorValidationIssue[] = [];
    const soft: NarratorValidationIssue[] = [];
    const mode = pack.chapterPresencePlan.modeProfile;

    const transition = pack.modeTransitions[0];
    if (transition) {
      const delta =
        PRESENCE_ORDER.indexOf(transition.toPresenceLevel) - PRESENCE_ORDER.indexOf(transition.fromPresenceLevel);
      if (delta > 2 && transition.requiredTriggerIds.length < 2) {
        hard.push(
          issue(
            "hard_failure",
            "abrupt_mode_shift",
            "Abrupt narrator mode shift detected without sufficient convergence trigger chain.",
            "Add intermediate transition stage and at least two trigger requirements.",
          ),
        );
      }
    }

    const forbidden = pack.chapterPresencePlan.modeProfile.forbiddenInterventions.join(" ").toLowerCase();
    if (!forbidden.includes("character")) {
      hard.push(
        issue(
          "hard_failure",
          "character_cognition_overwrite_risk",
          "Narrator safeguards do not explicitly forbid overwriting character-native cognition.",
          "Add explicit narrator-character boundary prohibition in mode profile.",
        ),
      );
    }

    if (
      pack.chapterPresencePlan.modeProfile.currentPresenceLevel === "invisible" &&
      pack.eraBridgeProfiles.some((bridge) => bridge.fromEraId !== bridge.toEraId)
    ) {
      hard.push(
        issue(
          "hard_failure",
          "continuity_drop_on_transition",
          "Narrator disappears during major era dislocation risk.",
          "Raise narrator presence to subtle/guiding during transition windows.",
        ),
      );
    }

    if (
      mode.currentPresenceLevel === "first_person" &&
      !pack.convergenceProfile.activeTriggers.some((trigger) => trigger.triggerType === "direct_witness_threshold")
    ) {
      hard.push(
        issue(
          "hard_failure",
          "premature_first_person_arrival",
          "First-person narrator arrived without direct witness threshold trigger.",
          "Require direct witness trigger before enabling first-person presence.",
        ),
      );
    }

    const interpretiveLevels = new Set(["interpretive", "reflective", "personal", "intimate", "first_person"]);
    const hasInterpretiveForce =
      interpretiveLevels.has(mode.currentPresenceLevel) ||
      mode.authorityMode === "interpretive" ||
      mode.authorityMode === "lineage_aware";
    const joinedPermittedInterventions = mode.permittedInterventions.join(" ").toLowerCase();
    const hasExplicitNarratorPresenceAllowance =
      joinedPermittedInterventions.includes("interpret") ||
      joinedPermittedInterventions.includes("reflective") ||
      joinedPermittedInterventions.includes("framing");
    const hasConvergenceJustification =
      pack.modeTransitions.some((row) => row.requiredTriggerIds.length > 0 && row.transitionRationale.trim().length > 0) &&
      pack.convergenceProfile.activeTriggers.length > 0;
    if (hasInterpretiveForce && (!hasExplicitNarratorPresenceAllowance || !hasConvergenceJustification)) {
      hard.push(
        issue(
          "hard_failure",
          "narrator_boundary_override_without_allowance",
          "Narrator interpretation risks overriding era-true character cognition without explicit allowance and convergence justification.",
          "Add explicit bounded interpretive allowance in narrator mode and ensure convergence trigger-linked justification is present.",
        ),
      );
    }

    if (mode.currentPresenceLevel === "first_person") {
      const lineageNearnessThresholdMet =
        pack.convergenceProfile.currentIdentityNearnessBand === "self_era_threshold" ||
        pack.convergenceProfile.currentIdentityNearnessBand === "lived_present";
      const narratorStakeThresholdMet = mode.emotionalStakeLevel >= 0.8;
      const continuityAnchorActive =
        pack.chapterPresencePlan.continuityAnchorUse.length > 0 && pack.hookContinuityAdapter.anchorContinuityReinforced;
      const hookContinuityPreservedAcrossShift =
        pack.hookContinuityAdapter.emotionalAttachmentPreserved &&
        pack.hookContinuityAdapter.structuralCuriosityPreserved &&
        pack.hookContinuityAdapter.unresolvedContinuityPressurePreserved;

      if (
        !lineageNearnessThresholdMet ||
        !narratorStakeThresholdMet ||
        !continuityAnchorActive ||
        !hookContinuityPreservedAcrossShift
      ) {
        hard.push(
          issue(
            "hard_failure",
            "first_person_convergence_gate_failed",
            "First-person narrator mode is invalid: convergence gates (lineage nearness, stake, anchor activity, hook continuity preservation) are not all satisfied.",
            "Only allow first-person mode when lineage nearness is self-threshold/lived, stake >= 0.8, continuity anchor is active, and hook continuity remains preserved.",
          ),
        );
      }
    }

    if (pack.eraBridgeProfiles.some((bridge) => bridge.reassuranceSignals.length === 0)) {
      hard.push(
        issue(
          "hard_failure",
          "bridge_anchor_absent",
          "Narrator continuity anchor absent in one or more era bridge profiles.",
          "Provide reassurance signals and anchor references for each bridge.",
        ),
      );
    }

    const nearness = pack.convergenceProfile.currentIdentityNearnessBand;
    const stake = pack.chapterPresencePlan.modeProfile.emotionalStakeLevel;
    if ((nearness === "self_era_threshold" || nearness === "lived_present") && stake < 0.65) {
      soft.push(
        issue(
          "soft_warning",
          "stake_timeline_mismatch",
          "Narrator stake level is low for current timeline proximity.",
          "Increase emotional stake floor or delay nearness band escalation.",
        ),
      );
    }

    const adjacent = pack.scenePresencePlans.map((plan) => plan.modeProfile.currentPresenceLevel);
    for (let index = 1; index < adjacent.length; index += 1) {
      const prev = adjacent[index - 1]!;
      const curr = adjacent[index]!;
      const delta = Math.abs(PRESENCE_ORDER.indexOf(curr) - PRESENCE_ORDER.indexOf(prev));
      if (delta >= 3) {
        soft.push(
          issue(
            "soft_warning",
            "adjacent_voice_inconsistency",
            `Voice shift from ${prev} to ${curr} may feel discontinuous without justification.`,
            "Add bridge marker or intermediate scene-level presence plan.",
          ),
        );
      }
    }

    const convergencePenalty = hard.length * 0.15 + soft.length * 0.05;
    const narratorConvergenceScore = Math.max(
      0,
      Math.min(1, Number((pack.convergenceProfile.convergenceProgressScore - convergencePenalty).toFixed(3))),
    );

    return NarratorPresenceValidationResultSchema.parse({
      artifact: "narrator_presence_validation_result",
      valid: hard.length === 0,
      hardFailures: hard,
      softWarnings: soft,
      narratorConvergenceScore,
      suggestedRepairs:
        hard.length + soft.length > 0
          ? [...hard, ...soft].map((row) => row.suggestedRepair)
          : ["No repair required; narrator continuity remains healthy."],
    });
  }
}
