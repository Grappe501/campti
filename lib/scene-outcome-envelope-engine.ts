import type { CharacterBrainState, SceneConstraintSummary } from "@/lib/brain-assembly-types";
import type { SceneTimeBrainRunnerOutput } from "@/lib/scene-brain-runner-types";
import type {
  SceneObjectiveMap,
  ScenePerceptionMap,
  ScenePressureMap,
  SceneRevealBudget,
} from "@/lib/scene-constraint-types";
import type { SceneReadinessClass } from "@/lib/scene-structured-data-patch";
import type { OutcomeEnvelopeEntry, SceneOutcomeEnvelope } from "@/lib/scene-outcome-envelope-types";

function uniqueStrings(items: Array<string | null | undefined>): string[] {
  return [...new Set(items.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))];
}

function outcomeLine(text: string, reason?: string): OutcomeEnvelopeEntry {
  return reason ? { text, reason } : { text };
}

function uniqueOutcomeEntries(items: OutcomeEnvelopeEntry[]): OutcomeEnvelopeEntry[] {
  const seen = new Set<string>();
  const out: OutcomeEnvelopeEntry[] = [];
  for (const e of items) {
    const key = `${e.text}\0${e.reason ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function bandRankScalar(
  band: CharacterBrainState["relationalSafety"]["disclosureCost"] | undefined,
): number {
  switch (band) {
    case "none":
    case "very_low":
      return 0;
    case "low":
      return 2;
    case "guarded":
      return 3;
    case "mixed":
      return 4;
    case "present":
      return 5;
    case "high":
      return 6;
    case "acute":
      return 7;
    default:
      return 0;
  }
}

export type BuildSceneOutcomeEnvelopeInput = {
  summary: SceneConstraintSummary | null;
  pressure: ScenePressureMap;
  perception: ScenePerceptionMap;
  objectives: SceneObjectiveMap;
  revealBudget: SceneRevealBudget;
  sceneReadinessClass: SceneReadinessClass;
  focalEvaluation: SceneTimeBrainRunnerOutput | null;
  brainState: CharacterBrainState | null;
};

/**
 * First-pass rules: blocked / costly / allowed / unstable outcome families from Stage 8 inputs.
 * No dialogue generation, branching tables, or persistence.
 */
export function buildSceneOutcomeEnvelope(input: BuildSceneOutcomeEnvelopeInput): SceneOutcomeEnvelope {
  const {
    summary,
    pressure,
    perception,
    objectives,
    revealBudget,
    sceneReadinessClass,
    focalEvaluation,
    brainState,
  } = input;

  const notes: string[] = [];
  const blockedOutcomes: OutcomeEnvelopeEntry[] = [];
  const costlyOutcomes: OutcomeEnvelopeEntry[] = [];
  const allowedOutcomes: OutcomeEnvelopeEntry[] = [];
  const unstableOutcomes: OutcomeEnvelopeEntry[] = [];

  const vis = pressure.sceneVisibility.toUpperCase();
  const isIntimatePublicVis =
    sceneReadinessClass === "intimate_disclosure" && (vis === "PUBLIC" || vis === "REVIEW");
  const blockedActions = uniqueStrings([...(summary?.blockedActions ?? [])]);
  for (const a of blockedActions) {
    blockedOutcomes.push(outcomeLine(`Violates blocked action: ${a}`, "blocked action from Stage 7.5 summary"));
  }

  if (summary?.forcedStillness) {
    blockedOutcomes.push(
      outcomeLine(
        "Unilateral physical exit or breaking position (verify against draft)",
        "blocked by forced stillness",
      ),
    );
    notes.push("Forced stillness present in Stage 7.5 summary.");
  }

  if (isIntimatePublicVis) {
    blockedOutcomes.push(
      outcomeLine(
        "Public spectacle, broadcast shame, or crowd-facing performance",
        "blocked: intimate disclosure class × elevated visibility",
      ),
    );
  }

  if (pressure.placeRiskFlags.includes("flood_elevated") || pressure.placeRiskFlags.includes("terrain_stress")) {
    blockedOutcomes.push(
      outcomeLine(
        "Carefree movement or logistics-ignoring escape (environment stress on linked place(s))",
        "blocked: flood or terrain stress on linked place(s)",
      ),
    );
  }
  if (pressure.placeRiskFlags.includes("drought_elevated")) {
    costlyOutcomes.push(
      outcomeLine(
        "Water- or comfort-dependent outcomes (elevated drought stress in linked environment)",
        "costly: drought stress on linked place(s)",
      ),
    );
  }

  const se = summary?.socialExposureScore;
  if (se != null && !Number.isNaN(se) && se >= 55) {
    costlyOutcomes.push(
      outcomeLine(
        "Reputational, shame, or audience-mediated outcomes",
        "costly due to high social exposure",
      ),
    );
  }
  const vp = summary?.violenceProximityScore;
  if (vp != null && !Number.isNaN(vp) && vp >= 45) {
    costlyOutcomes.push(
      outcomeLine(
        "Violence-adjacent or escalation outcomes",
        "costly: violence proximity score",
      ),
    );
  }

  const discBand = brainState?.relationalSafety.disclosureCost;
  const discRank = bandRankScalar(discBand);
  const focalRegulationStrained =
    focalEvaluation &&
    (focalEvaluation.regulationMode === "guarded" ||
      focalEvaluation.regulationMode === "frozen" ||
      focalEvaluation.regulationMode === "flooded" ||
      focalEvaluation.regulationMode === "overloaded");

  const dyadDisc = brainState?.relationalSafety.dyadDisclosure;
  if (discRank >= 6) {
    costlyOutcomes.push(
      outcomeLine(
        "Frank vulnerability or full transparency",
        "costly: high relational disclosure cost",
      ),
    );
  } else if (discRank >= 4) {
    if (isIntimatePublicVis && focalRegulationStrained) {
      unstableOutcomes.push(
        outcomeLine(
          "Open confession, emotional lay-down, or fluent vulnerable disclosure before scrutiny",
          "unstable: moderate disclosure cost × elevated visibility × strained focal regulation",
        ),
      );
    } else {
      costlyOutcomes.push(
        outcomeLine(
          "Open confession or full emotional lay-down beats",
          "costly: moderate relational disclosure cost",
        ),
      );
    }
  }

  if (dyadDisc && discRank >= 4) {
    costlyOutcomes.push(
      outcomeLine(
        "Overt naming or witness-legible confession-class beats",
        `costly: dyad disclosure profile (${dyadDisc.witnessSensitivity} witness; ${dyadDisc.namingVsHinting} naming vs implication; ${dyadDisc.reciprocityExpectation} reciprocity pull)`,
      ),
    );
  }

  const dom = perception.focalDominantInterpretation?.trim();
  if (dom) {
    costlyOutcomes.push(
      outcomeLine(
        `Outcomes that flatly contradict the dominant interpretation (“${dom.slice(0, 120)}${dom.length > 120 ? "…" : ""}”)`,
        "costly: contradicts dominant interpretation",
      ),
    );
  }

  if (sceneReadinessClass === "public_confrontation" && (vis === "PUBLIC" || vis === "REVIEW")) {
    costlyOutcomes.push(
      outcomeLine(
        "Audience-visible escalation, provocation, or public accountability beats",
        "costly: public confrontation — heat is legal but expensive",
      ),
    );
  }

  if (sceneReadinessClass === "ensemble_no_focal") {
    unstableOutcomes.push(
      outcomeLine(
        "Fluent intimate one-to-one disclosure while the room competes for salience",
        "unstable: ensemble class strains dyad fluency",
      ),
    );
  }

  const objectiveLine =
    objectives.focal?.sceneObjective?.trim() ||
    summary?.objective?.trim() ||
    null;
  if (objectiveLine) {
    allowedOutcomes.push(
      outcomeLine(
        `Progress aligned with objective: ${objectiveLine.slice(0, 200)}${objectiveLine.length > 200 ? "…" : ""}`,
        "allowed: aligns with stated objective",
      ),
    );
  } else {
    notes.push("No explicit scene objective — allowed outcomes default to low-commitment families.");
  }

  allowedOutcomes.push(
    outcomeLine("Dialogue, negotiation, or procedural handling of the moment", "allowed: default affordance"),
  );
  allowedOutcomes.push(
    outcomeLine(
      "Interior shift or reframe (non-performative, if visibility permits)",
      "allowed: non-performative interior work",
    ),
  );

  const revealTight = revealBudget.band === "tight" || revealBudget.band === "unknown";
  if (revealTight || isIntimatePublicVis) {
    allowedOutcomes.push(
      outcomeLine(
        "Implication-only or withheld beats",
        revealTight
          ? "allowed: tight or unknown reveal budget"
          : "allowed: implication-only stays on the table under intimate disclosure × elevated visibility",
      ),
    );
  }
  if (isIntimatePublicVis && revealBudget.band === "moderate") {
    costlyOutcomes.push(
      outcomeLine(
        "Partial disclosure or calibrated naming before an audience",
        "costly: intimate disclosure × elevated visibility × moderate reveal budget",
      ),
    );
  }
  if (!revealTight && isIntimatePublicVis && revealBudget.band === "open") {
    costlyOutcomes.push(
      outcomeLine(
        "Direct revelation or full naming under audience scrutiny",
        "costly: intimate disclosure × elevated visibility × open reveal budget",
      ),
    );
  }
  if (!revealTight && !isIntimatePublicVis) {
    allowedOutcomes.push(
      outcomeLine("Direct disclosure or naming", "allowed: reveal budget not tight"),
    );
  }

  if (revealBudget.band === "moderate") {
    unstableOutcomes.push(
      outcomeLine(
        "Large canonical reveals without calibration to perception gaps",
        "unstable: moderate reveal budget vs large swing",
      ),
    );
  }

  const highPressure = pressure.items.some((p) => p.strength === "high");
  if (!highPressure && !blockedActions.length) {
    allowedOutcomes.push(
      outcomeLine(
        "Non-violent de-escalation or exit",
        summary?.forcedStillness ? "allowed only if not blocked by stillness above" : "allowed: low pressure, no blocked actions",
      ),
    );
  }

  if (focalEvaluation) {
    const rm = focalEvaluation.regulationMode;
    if (rm === "frozen" || rm === "flooded" || rm === "overloaded") {
      unstableOutcomes.push(
        outcomeLine(
          `Fluent, instrumentally rational collaboration (fragile under focal regulation: ${rm})`,
          "unstable: focal regulation not available for clean cooperation",
        ),
      );
    } else if (rm === "guarded") {
      unstableOutcomes.push(
        outcomeLine(
          "Open, unguarded spontaneity",
          "unstable: focal regulation is guarded",
        ),
      );
    }

    if (focalEvaluation.speechWindow.style === "silent") {
      unstableOutcomes.push(
        outcomeLine(
          "Extended spoken argument or testimony",
          "unstable: speech window reads silent",
        ),
      );
    }

    const tens = focalEvaluation.actionWindow.ranked.tensionNotes;
    for (const t of tens.slice(0, 3)) {
      unstableOutcomes.push(outcomeLine(`Counterpart / action tension: ${t}`, "unstable: runner tension note"));
    }

    const ctx = focalEvaluation.counterpartSummary;
    if (ctx?.counterpartPersonId && focalEvaluation.actionWindow.blocked.length) {
      unstableOutcomes.push(
        outcomeLine(
          `Outcomes that ignore blocked action window with ${ctx.displayName} in frame`,
          "unstable: blocked action window with counterpart present",
        ),
      );
    }
  }

  if (perception.hiddenOrUnknown.length) {
    unstableOutcomes.push(
      outcomeLine(
        `Outcomes requiring pinned POV, cast, or place facts (gaps: ${perception.hiddenOrUnknown.slice(0, 3).join("; ")})`,
        "unstable: perception gaps",
      ),
    );
  }
  if (perception.ambiguousZones.length) {
    unstableOutcomes.push(
      outcomeLine(
        "Clean beat closure without addressing ambiguous zones",
        "unstable: ambiguous zones threaten continuity",
      ),
    );
  }

  if (perception.misreadRisks.length >= 2) {
    unstableOutcomes.push(
      outcomeLine(
        "Outcomes that depend on a single shared factual read",
        "unstable: elevated misread risk",
      ),
    );
  }

  return {
    allowedOutcomes: uniqueOutcomeEntries(allowedOutcomes),
    costlyOutcomes: uniqueOutcomeEntries(costlyOutcomes),
    blockedOutcomes: uniqueOutcomeEntries(blockedOutcomes),
    unstableOutcomes: uniqueOutcomeEntries(unstableOutcomes),
    notes: uniqueStrings([
      ...notes,
      focalEvaluation
        ? "Scene-time brain (runSceneTimeBrain) informed regulation / counterpart instability."
        : "Scene-time brain did not run — envelope uses summary + pressure + perception only where noted.",
      `Scene class: ${sceneReadinessClass}`,
    ]),
  };
}
