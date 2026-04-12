import type { CharacterCognitionFrame } from "@/lib/domain/cognition";
import type {
  ActionCandidate,
  ActionConstraint,
  AlternateOutcomeHypothesis,
  DecisionPressureBreakdown,
  PressureEntry,
} from "@/lib/domain/decision-trace";

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function rankFromStack(labels: string[], max: number, baseWeight: number): PressureEntry[] {
  const out: PressureEntry[] = [];
  for (let i = 0; i < Math.min(max, labels.length); i++) {
    const w = clamp01(baseWeight / (i + 1));
    out.push({ label: labels[i]!.slice(0, 280), weight: w });
  }
  return out;
}

/** Heuristic scores when author only supplies a label (0–100). */
export function buildActionCandidateFromLabel(
  label: string,
  partial?: Partial<Omit<ActionCandidate, "label">>
): ActionCandidate {
  const id = partial?.actionId?.trim() || `author:${label.slice(0, 48).replace(/\s+/g, "_")}`;
  return {
    actionId: id,
    label: label.trim(),
    actionType: partial?.actionType?.trim() || "unspecified",
    targetPersonId: partial?.targetPersonId ?? null,
    targetObject: partial?.targetObject ?? null,
    socialRisk: partial?.socialRisk ?? 45,
    bodilyCost: partial?.bodilyCost ?? 35,
    desireReward: partial?.desireReward ?? 40,
    dutyAlignment: partial?.dutyAlignment ?? 45,
    tabooSeverity: partial?.tabooSeverity ?? 35,
  };
}

/**
 * Map cognition stacks and vectors into comparable pressure weights (deterministic).
 */
export function deriveActionPressureWeights(frame: CharacterCognitionFrame): {
  activeMotive: PressureEntry[];
  suppressedMotive: PressureEntry[];
  fears: PressureEntry[];
  desires: PressureEntry[];
  embodiment: PressureEntry[];
} {
  const activeMotive = rankFromStack(
    frame.activeMotives.map((s) => s),
    8,
    1
  );
  const suppressedMotive = rankFromStack(
    frame.suppressedMotives.map((s) => s),
    8,
    0.85
  );
  const fears = rankFromStack(
    frame.fearStack.map((x) => x.label),
    8,
    1
  );
  const v = frame.activeDesireSignals;
  const desires: PressureEntry[] = [
    { label: "Relief / end strain", weight: clamp01(v.relief * 0.9 + 0.05) },
    { label: "Belonging / place", weight: clamp01(v.belonging * 0.85) },
    { label: "Need to be needed", weight: clamp01(v.needToBeNeeded * 0.9) },
    { label: "Erotic / fusion pull (situated)", weight: clamp01(v.erotic * 0.75) },
    { label: "Approval / face", weight: clamp01(v.approval * 0.85) },
  ].sort((a, b) => b.weight - a.weight);

  const phys = frame.characterPhysicalState;
  const emb = frame.embodiedCognitionEffects;
  const embodiment: PressureEntry[] = [
    { label: `Pain load ${phys.painLevel}/100`, weight: clamp01(phys.painLevel / 100) },
    { label: `Fatigue ${phys.fatigueLevel}/100`, weight: clamp01(phys.fatigueLevel / 100) },
    { label: `Hunger ${phys.hungerLevel}/100`, weight: clamp01(phys.hungerLevel / 100) },
    { label: `Urgency (embodiment) ${(emb.urgencyAmplification * 100).toFixed(0)}`, weight: emb.urgencyAmplification },
  ].sort((a, b) => b.weight - a.weight);

  return { activeMotive, suppressedMotive, fears, desires, embodiment };
}

/** Scene-time spikes vs chronic stacks — what “tripped” the moment. */
export function deriveTriggerPressures(frame: CharacterCognitionFrame): PressureEntry[] {
  const sn = frame.stateSnapshot;
  const out: PressureEntry[] = [];
  if (sn?.currentFear?.trim()) {
    out.push({
      label: `Fear spike (snapshot): ${sn.currentFear.trim().slice(0, 220)}`,
      weight: 0.95,
    });
  }
  if (sn?.currentAnger?.trim()) {
    out.push({
      label: `Anger heat: ${sn.currentAnger.trim().slice(0, 220)}`,
      weight: 0.88,
    });
  }
  if (sn?.currentSocialRisk?.trim()) {
    out.push({
      label: `Social risk: ${sn.currentSocialRisk.trim().slice(0, 220)}`,
      weight: 0.85,
    });
  }
  if (sn?.currentHope?.trim()) {
    out.push({ label: `Hope pull: ${sn.currentHope.trim().slice(0, 180)}`, weight: 0.55 });
  }
  if (frame.scene.narrativeIntent?.trim()) {
    out.push({
      label: `Scene intent hook: ${frame.scene.narrativeIntent.trim().slice(0, 160)}`,
      weight: 0.42,
    });
  }
  if (!out.length && frame.fearStack.length) {
    out.push({
      label: `Ambient fear (top of stack): ${frame.fearStack[0]!.label.slice(0, 200)}`,
      weight: 0.65,
    });
  }
  return out.slice(0, 8);
}

export function buildDecisionPressureBreakdown(frame: CharacterCognitionFrame): DecisionPressureBreakdown {
  const w = deriveActionPressureWeights(frame);
  const triggerPressures = deriveTriggerPressures(frame);

  const worldStateConstraints: ActionConstraint[] = [];
  const wd = frame.worldDesireEnvironment;
  worldStateConstraints.push({
    constraintId: "desire_visibility",
    label: `Visibility risk for desire (${wd.visibilityRiskForDesire}/100)`,
    severity: wd.visibilityRiskForDesire,
    source: "honor",
  });
  worldStateConstraints.push({
    constraintId: "law_punishment",
    label: `Punishment severity for forbidden want (${wd.punishmentSeverityForForbiddenDesire}/100)`,
    severity: wd.punishmentSeverityForForbiddenDesire,
    source: "law",
  });
  worldStateConstraints.push({
    constraintId: "kin_prohibition",
    label: `Kinship prohibition climate (${wd.kinshipProhibitionSeverity}/100)`,
    severity: wd.kinshipProhibitionSeverity,
    source: "kin",
  });

  const selfDeceptionFactors = frame.selfDeceptionPattern
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  return {
    motiveActive: w.activeMotive,
    motiveSuppressed: w.suppressedMotive,
    triggerPressures,
    fearDrivers: w.fears,
    desireDrivers: w.desires,
    embodimentDrivers: w.embodiment,
    worldStateConstraints,
    selfDeceptionFactors,
  };
}

export function explainSelectedActionFromCognition(
  frame: CharacterCognitionFrame,
  selected: ActionCandidate,
  breakdown: DecisionPressureBreakdown
): string {
  const topFear = breakdown.fearDrivers[0]?.label ?? "—";
  const topActive = breakdown.motiveActive[0]?.label ?? "—";
  const topSupp = breakdown.motiveSuppressed[0]?.label ?? "—";
  const topDesire = breakdown.desireDrivers[0]?.label ?? "—";
  return [
    `Action considered: ${selected.label} (type ${selected.actionType}).`,
    `Dominant active motive cue: ${topActive}.`,
    `Strongest fear cue in stack: ${topFear}.`,
    `Strongest desire-channel cue: ${topDesire}.`,
    `Top suppressed / shame-adjacent pressure: ${topSupp}.`,
    `Identity tension (frame): ${frame.identityConflict.slice(0, 360)}`,
  ].join(" ");
}

export function compareSelectedVsAlternateAction(
  selected: ActionCandidate,
  alternate: ActionCandidate | null
): AlternateOutcomeHypothesis | null {
  if (!alternate) return null;
  const riskDelta = selected.socialRisk - alternate.socialRisk;
  const tabooDelta = selected.tabooSeverity - alternate.tabooSeverity;
  const dutyDelta = selected.dutyAlignment - alternate.dutyAlignment;
  const whyNot =
    tabooDelta > 15
      ? `Alternate “${alternate.label}” reads as more taboo/less face-safe than the chosen path.`
      : riskDelta < -15
        ? `Alternate “${alternate.label}” implies higher social exposure than chosen.`
        : dutyDelta < -10
          ? `Alternate “${alternate.label}” aligns less with stated duty/obligation cues.`
          : `Alternate “${alternate.label}” trades different costs (risk ${riskDelta}, taboo ${tabooDelta}, duty ${dutyDelta})—not automatically inferior, just a different pressure mix.`;

  return {
    alternateLabel: alternate.label,
    whyNotChosen: whyNot,
    whatWouldNeedToChange: [
      tabooDelta > 10 ? "Lower taboo severity or move scene to a private register." : "",
      riskDelta < -10 ? "Reduce honor/shame visibility or shift witnesses." : "",
      dutyDelta < -10 ? "Change obligation stack (new kin/legal pressure) or explicit duty authoring." : "",
    ].filter(Boolean),
  };
}
