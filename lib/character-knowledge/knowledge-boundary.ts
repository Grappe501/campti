/**
 * P2-F — Character knowledge boundary engine (epistemic horizon).
 *
 * **Temporal truth integrity:** cognition and dialogue must not exceed what this character could
 * plausibly know or believe in-era. This module produces explicit **known / believed / unknown**
 * buckets so prompts and future interactive layers can forbid omniscient answers without ad hoc rules.
 *
 * Rules encoded here (deterministic, heuristic):
 * - No future knowledge relative to story year / world slice.
 * - No global omniscience — witness and source scope cap what counts as “known.”
 * - Uncertainty is normal: interpretive sources and gossip live under **believed**, not **known**.
 */

import { NarrativeSourceScope, NarrativeSourceTruthMode } from "@/lib/domain/narrative-source";
import type { NarrativeSource } from "@/lib/domain/narrative-source";

const CAP = 24;

function cap(lines: string[]): string[] {
  return lines.filter(Boolean).slice(0, CAP);
}

export type CharacterKnowledgeBoundary = {
  /** Facts treated as accessible ground for this character in this scene (assertions, authoritative sources, immediate scene anchor). */
  knownFacts: string[];
  /** Hearsay, opinion, interpretive scholarship, declared fiction — may be wrong. */
  believedFacts: string[];
  /** Explicit epistemic gaps — model must not fill these with modern or off-stage omniscience. */
  unknownDomains: string[];
};

export type BuildCharacterKnowledgeBoundaryParams = {
  worldStateLabel: string | null;
  approximateStoryYear: number | null;
  /** From literary profile / core: social position, role archetype, education hints. */
  socialRoleHint: string | null;
  /** Era literacy norm (clerical); gates abstract document knowledge. */
  literacyClerical: "rare" | "minority" | "common" | "widespread" | null;
  /** Short lines: "Name: relationshipType" etc. */
  relationshipLines: string[];
  /** P2-E temporally filtered narrative sources for this scene. */
  narrativeSources: NarrativeSource[];
  /** Slot labels or short lines from genealogical assertions tied to the character. */
  assertionSlotLabels: string[];
  /** Resolved perceived reality one-liner (phenomenological anchor). */
  perceivedReality: string;
  /** 0–1 social field gossip pressure when available. */
  gossipPressure01: number | null;
  witnessRisk01: number | null;
};

export function buildCharacterKnowledgeBoundary(
  params: BuildCharacterKnowledgeBoundaryParams
): CharacterKnowledgeBoundary {
  const knownFacts: string[] = [];
  const believedFacts: string[] = [];
  const unknownDomains: string[] = [];

  const pr = params.perceivedReality?.trim();
  if (pr) {
    knownFacts.push(`Immediate perception (scene-local): ${pr.slice(0, 400)}${pr.length > 400 ? "…" : ""}`);
  }

  if (params.worldStateLabel?.trim()) {
    knownFacts.push(`Situated in era/world slice: ${params.worldStateLabel.trim()}`);
  }

  for (const label of params.assertionSlotLabels) {
    const t = label.trim();
    if (t) knownFacts.push(`Structured record / assertion scope: ${t}`);
  }

  for (const line of params.relationshipLines) {
    const t = line.trim();
    if (t) {
      knownFacts.push(`Social tie (local graph — not full interior life): ${t}`);
    }
  }

  for (const src of params.narrativeSources) {
    const title = src.title.trim();
    const mode = src.truthMode;
    if (mode === NarrativeSourceTruthMode.Authoritative) {
      knownFacts.push(
        `Source material (authoritative) — ${title}${src.tags?.length ? ` [tags: ${src.tags.slice(0, 6).join(", ")}]` : ""}`
      );
    } else if (mode === NarrativeSourceTruthMode.Interpretive) {
      believedFacts.push(
        `Scholarly / interpretive reading (not court truth): ${title}`
      );
    } else if (mode === NarrativeSourceTruthMode.Fictionalized) {
      believedFacts.push(`Declared narrative license / fiction strand: ${title}`);
    } else {
      believedFacts.push(`Unclassified source mode "${mode}": ${title} — treat as uncertain.`);
    }
  }

  if (params.socialRoleHint?.trim()) {
    knownFacts.push(`Social station / role hint: ${params.socialRoleHint.trim()}`);
  }

  if (params.gossipPressure01 != null && params.gossipPressure01 >= 0.45) {
    believedFacts.push(
      `High gossip pressure (${params.gossipPressure01.toFixed(2)}) — corridor talk may be distorted or false.`
    );
  } else if (params.gossipPressure01 != null && params.gossipPressure01 > 0.2) {
    believedFacts.push(
      `Moderate gossip (${params.gossipPressure01.toFixed(2)}) — verify nothing against omniscient certainty.`
    );
  }

  if (params.witnessRisk01 != null && params.witnessRisk01 >= 0.45) {
    knownFacts.push(
      `High witness exposure (${params.witnessRisk01.toFixed(2)}) — others may see or spread what happens here.`
    );
  }

  // --- Unknown domains (explicit non-omniscience) ---
  unknownDomains.push(
    "No omniscient access: no narrator-grade knowledge of off-stage interiors, distant battlefields, or other households unless a listed source or scene-local witness implies it."
  );

  if (params.approximateStoryYear != null) {
    unknownDomains.push(
      `No knowledge of real-world events after ~${params.approximateStoryYear} (story calendar); no anachronistic concepts or hindsight.`
    );
  } else {
    unknownDomains.push(
      "No foreknowledge of later history when story year is unspecified — stay in immediate scene and listed materials."
    );
  }

  const lit = params.literacyClerical;
  if (lit === "rare" || lit === "minority") {
    unknownDomains.push(
      "Print culture, distant bureaucratic records, and formal archives are not generally accessible except through oral report or role-specific literacy implied by sources."
    );
  } else if (lit === "common" || lit === "widespread") {
    unknownDomains.push(
      "Even with broader literacy, no automatic knowledge of documents the character has not plausibly encountered in-scene or via listed sources."
    );
  }

  const scopes = new Set(params.narrativeSources.map((s) => s.scope));
  const hasGlobal = scopes.has(NarrativeSourceScope.Global);
  if (params.narrativeSources.length > 0 && !hasGlobal) {
    unknownDomains.push(
      "No default knowledge of empire-wide or world-spanning facts unless covered by a global-scope source in the list above."
    );
  }

  if (params.narrativeSources.length === 0) {
    unknownDomains.push(
      "No dedicated narrative source bundle for this slice — lean on scene facts, relationships, and assertions only; do not invent archival certainty."
    );
  }

  return {
    knownFacts: cap(knownFacts),
    believedFacts: cap(believedFacts),
    unknownDomains: cap(unknownDomains),
  };
}
