import type { CharacterCore, CharacterState } from "@/lib/domain/cognition";
import type {
  CharacterDesireBundle,
  DesireConflictPattern,
  DesirePressureSummary,
  DesireVector,
  WorldStateDesireEnvironment,
} from "@/lib/domain/desire-cognition";
import type { CharacterAgeBand, RankedCognitionItem } from "@/lib/domain/inner-voice";
import type { EnneagramProfile } from "@/lib/domain/enneagram";
import type { WorldStateThoughtStyle } from "@/lib/domain/inner-voice";
import type { EnneagramShapingResult } from "@/lib/enneagram/enneagram-cognition-shaping";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function renumber(items: RankedCognitionItem[]): RankedCognitionItem[] {
  return items.map((x, i) => ({ ...x, rank: i + 1 }));
}

function dedupeStack(items: RankedCognitionItem[]): RankedCognitionItem[] {
  const seen = new Set<string>();
  const out: RankedCognitionItem[] = [];
  for (const it of items) {
    const k = it.label.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ rank: 0, label: k });
  }
  return out;
}

/** Gates erotic/romantic vectors by developmental band (deterministic, not moral prescription). */
export function ageDesireVisibilityFactor(ageBand: CharacterAgeBand | null): number {
  if (!ageBand) return 0.75;
  switch (ageBand) {
    case "EARLY_CHILD":
      return 0.08;
    case "LATE_CHILD":
      return 0.18;
    case "ADOLESCENT":
      return 0.58;
    case "YOUNG_ADULT":
      return 0.92;
    case "ADULT":
    case "ELDER":
      return 0.95;
    default:
      return 0.75;
  }
}

export function deriveAttachmentLongingSignals(
  bundle: CharacterDesireBundle,
  state: CharacterState | null,
  world: WorldStateDesireEnvironment
): { summary: string; activation: number } {
  const a = bundle.attachment;
  let hunger = a.wantednessHunger;
  let fearUn = a.fearOfUnwantedness;
  if (state?.currentWantednessHunger != null) {
    hunger = clamp100((hunger + state.currentWantednessHunger) / 2);
  }
  if (state?.currentAttachmentAche != null) {
    hunger = clamp100(hunger + state.currentAttachmentAche * 0.15);
  }
  const vis = world.visibilityRiskForDesire / 100;
  fearUn = clamp100(fearUn + vis * 22);

  const summary = [
    `Wantedness hunger ${hunger}/100; fear of being unwanted ${fearUn}/100.`,
    `Dependency pull ${a.dependencyPull}/100; rescue fantasy ${a.rescueFantasyLevel}/100.`,
    `Approval sensitivity ${a.approvalSensitivity}/100; abandonment ache ${a.abandonmentAche}/100.`,
  ].join(" ");

  const activation = clamp01((hunger + fearUn + a.abandonmentAche) / 300);
  return { summary, activation };
}

export function derivePleasurePressureSignals(
  bundle: CharacterDesireBundle,
  state: CharacterState | null,
  world: WorldStateDesireEnvironment
): { summary: string; forbiddenPressure: number } {
  const p = bundle.pleasure;
  let forbiddenPressure = p.shameAfterPleasureLikelihood;
  forbiddenPressure = clamp100(
    forbiddenPressure + world.religiousGuiltIntensity * 0.25 + world.eroticTabooSeverity * 0.2
  );
  if (state?.currentForbiddenDesirePressure != null) {
    forbiddenPressure = clamp100((forbiddenPressure + state.currentForbiddenDesirePressure) / 2);
  }

  const summary = [
    `Pleasure seeking style: ${p.pleasureSeekingStyle}.`,
    p.soothingSources.length ? `Soothing: ${p.soothingSources.slice(0, 4).join("; ")}.` : "",
    p.forbiddenPleasureTriggers.length
      ? `Forbidden pleasure triggers: ${p.forbiddenPleasureTriggers.slice(0, 4).join("; ")}.`
      : "",
    `Shame-after-pleasure likelihood ${p.shameAfterPleasureLikelihood}/100 (raised by world guilt/taboo to ~${forbiddenPressure.toFixed(0)}).`,
  ]
    .filter(Boolean)
    .join(" ");

  return { summary, forbiddenPressure: forbiddenPressure / 100 };
}

export function deriveActiveDesireSignals(
  bundle: CharacterDesireBundle,
  state: CharacterState | null,
  world: WorldStateDesireEnvironment,
  ageBand: CharacterAgeBand | null,
  _enneagram: EnneagramProfile,
  worldStyle: WorldStateThoughtStyle | null
): DesireVector {
  const d = bundle.desire;
  const gate = ageDesireVisibilityFactor(ageBand);
  const kin = world.kinshipProhibitionSeverity / 100;
  const marry = world.propertyMarriagePressure / 100;

  const eroticRaw = (d.desireForEroticFusion * 0.45 + d.desireForPossession * 0.25 + d.desireForTouch * 0.2) / 100;
  let erotic = clamp01(eroticRaw * gate * (1 - kin * 0.35) * (1 - marry * 0.15));
  if (state?.currentArousal != null) {
    erotic = clamp01(erotic + (state.currentArousal / 100) * 0.35 * gate);
  }

  const touch = clamp01((d.desireForTouch / 100) * (0.35 + gate * 0.65));
  const protection = clamp01(d.desireForProtection / 100);
  const recognition = clamp01(d.desireForRecognition / 100);
  let needToBeNeeded = clamp01(d.desireForNeedfulness / 100);
  if (state?.currentNeedToBeNeeded != null) {
    needToBeNeeded = clamp01((needToBeNeeded + state.currentNeedToBeNeeded / 100) / 2);
  }
  const dominance = clamp01(d.desireForDominance / 100);
  const submission = clamp01(d.desireForSubmission / 100);
  const approval = clamp01(d.desireForApproval / 100);
  const belonging = clamp01(d.desireForBelonging / 100);
  let relief = clamp01(d.desireForRelief / 100);
  if (state?.currentResentmentAtDeprivation != null) {
    relief = clamp01(relief + state.currentResentmentAtDeprivation / 150);
  }
  const escape = clamp01(d.desireForEscape / 100);
  const devotion = clamp01(d.desireForDevotion / 100);
  const possession = clamp01(d.desireForPossession / 100);
  const freedom = clamp01(d.desireForFreedom / 100);

  let attachmentAche = bundle.attachment.abandonmentAche / 100;
  if (state?.currentLoneliness != null) {
    attachmentAche = clamp01(attachmentAche + state.currentLoneliness / 130);
  }

  const { forbiddenPressure } = derivePleasurePressureSignals(bundle, state, world);

  const classSalience = worldStyle?.classStatusSalience ? worldStyle.classStatusSalience / 100 : 0.5;
  const honor = worldStyle?.honorShameSalience ? worldStyle.honorShameSalience / 100 : 0.5;

  return {
    touch: clamp01(touch * (1 + honor * 0.08)),
    protection,
    recognition: clamp01(recognition * (1 + classSalience * 0.12)),
    needToBeNeeded,
    erotic,
    dominance,
    submission,
    approval,
    belonging,
    relief,
    escape,
    devotion,
    possession,
    freedom,
    attachmentAche,
    forbiddenPressure,
  };
}

export function buildDesireConflictPattern(
  bundle: CharacterDesireBundle,
  vectors: DesireVector
): DesireConflictPattern {
  const conscious: string[] = [];
  const suppressed: string[] = [];
  const displaced: string[] = [];
  const misrecognized: string[] = [];
  const rationalized: string[] = [];

  if (vectors.belonging > 0.45) conscious.push("Belonging and right place in the household or kin web.");
  if (vectors.approval > 0.5) conscious.push("Approval of elders, betters, or the face one must keep.");
  if (vectors.relief > 0.48) conscious.push("Relief from strain, hunger, cold, or shame heat.");

  if (vectors.erotic > 0.35) suppressed.push("Erotic pull kept from speech; routed through secrecy or denial.");
  if (bundle.sexual.unspeakableDesires.length) {
    suppressed.push(...bundle.sexual.unspeakableDesires.slice(0, 3).map((x) => `Unspeakable: ${x}`));
  }

  displaced.push(
    ...bundle.sexual.displacementHabits.slice(0, 4).map((x) => `Displacement habit: ${x}`)
  );

  if (vectors.needToBeNeeded > 0.5 && vectors.attachmentAche > 0.45) {
    misrecognized.push("Need to be needed may mask fear of abandonment.");
  }

  if (vectors.devotion > 0.42 && vectors.possession > 0.38) {
    rationalized.push("Devotion language may cloak possessive or envious want.");
  }

  return {
    consciousWant: conscious,
    suppressedWant: suppressed,
    displacedWant: displaced,
    misrecognizedWant: misrecognized,
    rationalizedWant: rationalized,
  };
}

export function buildDesirePressureSummary(
  bundle: CharacterDesireBundle,
  vectors: DesireVector,
  attach: ReturnType<typeof deriveAttachmentLongingSignals>,
  pleasure: ReturnType<typeof derivePleasurePressureSignals>,
  conflict: DesireConflictPattern
): DesirePressureSummary {
  const channels: { key: keyof DesireVector; label: string }[] = [
    { key: "attachmentAche", label: "attachment ache" },
    { key: "erotic", label: "erotic fusion / secrecy" },
    { key: "needToBeNeeded", label: "need to be needed" },
    { key: "belonging", label: "belonging" },
    { key: "relief", label: "relief" },
    { key: "approval", label: "approval" },
    { key: "protection", label: "protection / rescue" },
    { key: "touch", label: "touch / bodily nearness" },
  ];
  const sorted = channels
    .map((c) => ({ label: c.label, v: vectors[c.key] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
    .map((x) => `${x.label} (${(x.v * 100).toFixed(0)})`);

  const shameHint = [
    bundle.sexual.shameBindTags.length
      ? `Shame binds: ${bundle.sexual.shameBindTags.slice(0, 5).join(", ")}.`
      : "",
    bundle.sexual.legitimacyNarrative.trim()
      ? `Legitimacy story: ${bundle.sexual.legitimacyNarrative.slice(0, 220)}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sexualSummary = [
    bundle.sexual.pastSexualProclivityNotes.slice(0, 2).join(" | "),
    bundle.sexual.unspeakableDesires.length ? "[redacted wants present — see suppressed bucket]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    dominantDesireChannels: sorted,
    attachmentAcheSummary: attach.summary,
    pleasurePressureSummary: pleasure.summary,
    sexualConstraintSummary: sexualSummary || "Sexual constraint profile thin — infer from world taboo + kin duty.",
    shameBoundDesireHint: shameHint || "Shame binds not explicitly authored on core.",
    displacementNotes: bundle.sexual.displacementHabits.slice(0, 4).join("; ") || "—",
    conflictSnapshot: conflict,
    vectors,
  };
}

export function applyDesireShapingToCognitionFrame(
  shaped: EnneagramShapingResult,
  input: {
    bundle: CharacterDesireBundle;
    coreProfile: CharacterCore | null;
    stateSnapshot: CharacterState | null;
    worldDesire: WorldStateDesireEnvironment;
    cognitionAgeBand: CharacterAgeBand | null;
    enneagramProfile: EnneagramProfile;
    worldStyle: WorldStateThoughtStyle | null;
  }
): EnneagramShapingResult & { desirePressureSummary: DesirePressureSummary } {
  const { bundle, coreProfile, stateSnapshot, worldDesire, cognitionAgeBand, enneagramProfile, worldStyle } =
    input;

  const attach = deriveAttachmentLongingSignals(bundle, stateSnapshot, worldDesire);
  const pleasure = derivePleasurePressureSignals(bundle, stateSnapshot, worldDesire);
  const vectors = deriveActiveDesireSignals(
    bundle,
    stateSnapshot,
    worldDesire,
    cognitionAgeBand,
    enneagramProfile,
    worldStyle
  );
  const conflict = buildDesireConflictPattern(bundle, vectors);
  const desirePressureSummary = buildDesirePressureSummary(
    bundle,
    vectors,
    attach,
    pleasure,
    conflict
  );

  let perceivedReality = shaped.resolved.perceivedReality;
  perceivedReality = `${perceivedReality} Desire/attachment read: ${desirePressureSummary.dominantDesireChannels.join("; ")}.`;
  if (coreProfile?.notesDesire?.trim()) {
    perceivedReality = `${perceivedReality} Author desire notes: ${coreProfile.notesDesire.trim().slice(0, 280)}`;
  }

  const activeMotives = [...shaped.resolved.activeMotives];
  if (vectors.relief > 0.52) {
    activeMotives.unshift(`Seek relief (pressure ${(vectors.relief * 100).toFixed(0)}): rest, ease, end to strain.`);
  }
  if (vectors.belonging > 0.48) {
    activeMotives.unshift(`Long for belonging and right standing among kin/household (weight ${(vectors.belonging * 100).toFixed(0)}).`);
  }
  if (vectors.needToBeNeeded > 0.5) {
    activeMotives.unshift(`Want to be needed — usefulness as proof against abandonment (weight ${(vectors.needToBeNeeded * 100).toFixed(0)}).`);
  }
  if (vectors.erotic > 0.32 && ageDesireVisibilityFactor(cognitionAgeBand) > 0.25) {
    activeMotives.unshift(
      `Erotic pull (historically situated; shame/kin/property bound): intensity ${(vectors.erotic * 100).toFixed(0)}.`
    );
  }
  if (
    stateSnapshot?.currentPleasureSeeking != null &&
    stateSnapshot.currentPleasureSeeking >= 55
  ) {
    activeMotives.unshift(
      `Scene-heightened pleasure seeking (${stateSnapshot.currentPleasureSeeking}/100).`
    );
  }

  const suppressedMotives = [...shaped.resolved.suppressedMotives];
  for (const s of conflict.suppressedWant) {
    if (s) suppressedMotives.unshift(s);
  }
  if (vectors.forbiddenPressure > 0.45) {
    suppressedMotives.unshift(
      `Forbidden want under taboo/punishment climate (world severity ~${worldDesire.punishmentSeverityForForbiddenDesire}).`
    );
  }

  const fearStack = dedupeStack([
    ...attach.activation > 0.35
      ? [
          {
            rank: 0,
            label: `Fear of being unwanted or easily replaced (attachment activation ${(attach.activation * 100).toFixed(0)}).`,
          },
        ]
      : [],
    ...(worldDesire.visibilityRiskForDesire > 62
      ? [
          {
            rank: 0,
            label: `Fear of visible desire: exposure, rumor, loss of honor (${worldDesire.visibilityRiskForDesire}/100 visibility risk).`,
          },
        ]
      : []),
    ...(worldDesire.punishmentSeverityForForbiddenDesire > 60 && vectors.erotic > 0.28
      ? [
          {
            rank: 0,
            label: `Fear of punishment for transgressive want (${worldDesire.punishmentSeverityForForbiddenDesire}/100).`,
          },
        ]
      : []),
    ...shaped.resolved.fearStack.map((x) => ({ ...x, rank: 0 })),
  ]);
  const fearRenumbered = renumber(fearStack).slice(0, 16);

  const obligationStack = dedupeStack([
    ...(worldDesire.householdDutyOverride > 55
      ? [
          {
            rank: 0,
            label: `Household duty may override private hunger (${worldDesire.householdDutyOverride}/100).`,
          },
        ]
      : []),
    ...(worldDesire.propertyMarriagePressure > 55
      ? [
          {
            rank: 0,
            label: `Marriage/property order constrains who/what may be wanted (${worldDesire.propertyMarriagePressure}/100).`,
          },
        ]
      : []),
    ...shaped.resolved.obligationStack.map((x) => ({ ...x, rank: 0 })),
  ]);
  const obligationRenumbered = renumber(obligationStack).slice(0, 18);

  const decisionBiases = [
    ...shaped.resolved.decisionBiases,
    `desire:relief=${vectors.relief.toFixed(2)};belonging=${vectors.belonging.toFixed(2)};erotic_gate=${ageDesireVisibilityFactor(cognitionAgeBand).toFixed(2)}`,
    `world:erotic_taboo=${worldDesire.eroticTabooSeverity};kin_prohibition=${worldDesire.kinshipProhibitionSeverity}`,
  ];

  let identityConflict = shaped.resolved.identityConflict;
  identityConflict = [
    identityConflict,
    conflict.misrecognizedWant.join(" | "),
    conflict.rationalizedWant.join(" | "),
  ]
    .filter(Boolean)
    .join(" | ");

  const selfDeceptionPattern = [
    shaped.selfDeceptionPattern,
    `Desire self-story: ${bundle.sexual.legitimacyNarrative ? bundle.sexual.legitimacyNarrative.slice(0, 200) : "infer from virtue/vice and world shame binds"}`,
  ]
    .filter(Boolean)
    .join(" | ");

  const tabooThoughtPattern = [
    shaped.tabooThoughtPattern,
    `Forbidden desire pressure ${(vectors.forbiddenPressure * 100).toFixed(0)}; unspeakable channels: ${bundle.sexual.unspeakableDesires.length ? "present (core)" : "unspecified"}.`,
    `Pleasure shame likelihood ${bundle.pleasure.shameAfterPleasureLikelihood}/100; religious guilt climate ${worldDesire.religiousGuiltIntensity}/100.`,
  ]
    .join(" | ");

  return {
    resolved: {
      ...shaped.resolved,
      perceivedReality,
      activeMotives,
      suppressedMotives,
      fearStack: fearRenumbered,
      obligationStack: obligationRenumbered,
      identityConflict: identityConflict || "—",
      decisionBiases,
    },
    selfDeceptionPattern,
    tabooThoughtPattern,
    desirePressureSummary,
  };
}
