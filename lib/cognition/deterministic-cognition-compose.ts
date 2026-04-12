import type {
  CharacterProfile,
  CharacterRelationship,
  GenealogicalAssertion,
  WorldStateReference,
} from "@prisma/client";

import type { CharacterCore, CharacterState } from "@/lib/domain/cognition";

/** Subset of simulation `CharacterState` used for cognition merge. */
export type LegacySimulationCharacterState = {
  emotionalState?: string | null;
  motivation?: string | null;
  fearState?: string | null;
  socialConstraint?: string | null;
  structuredDataJson?: unknown;
};

export type CognitionComposeInput = {
  personName: string;
  literaryProfile: CharacterProfile | null;
  coreProfile: CharacterCore | null;
  state: CharacterState | null;
  legacySimulationState: LegacySimulationCharacterState | null;
  effectiveWorldState: Pick<WorldStateReference, "id" | "eraId" | "label"> | null;
  scene: {
    id: string;
    description: string;
    summary: string | null;
    narrativeIntent: string | null;
    emotionalTone: string | null;
    structuredDataJson: unknown;
  };
  relationships: CharacterRelationship[];
  relevantAssertions: Array<
    Pick<GenealogicalAssertion, "id" | "valueJson" | "narrativePreferred"> & {
      slot?: { label?: string | null } | null;
    }
  >;
};

function nonEmpty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function jsonToLines(v: unknown, maxLines: number): string[] {
  if (v == null) return [];
  if (typeof v === "string") {
    const t = v.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const item of v) {
      if (typeof item === "string" && item.trim()) out.push(item.trim());
      else if (item != null && typeof item === "object")
        out.push(JSON.stringify(item));
      if (out.length >= maxLines) break;
    }
    return out;
  }
  if (typeof v === "object") {
    return [JSON.stringify(v)];
  }
  return [String(v)];
}

function decisionStyleLabels(v: unknown): string[] {
  if (v == null) return [];
  if (typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o).filter((k) => o[k] != null);
    if (keys.length) return keys.slice(0, 12);
  }
  return jsonToLines(v, 8);
}

/**
 * Deterministic merge of core profile, scene snapshot, world state, relationships, and facts.
 * No LLM — stable ordering for inspection and downstream prompt construction.
 */
export function composeDeterministicCognitionLayer(
  input: CognitionComposeInput
): import("@/lib/domain/cognition").ResolvedCognitionLayer {
  const ws = input.effectiveWorldState;
  const sceneHead =
    nonEmpty(input.scene.summary) ?? nonEmpty(input.scene.description) ?? "";
  const era = ws ? `${ws.label} (${ws.eraId})` : "unspecified era slice";

  const perceivedReality = [
    `${input.personName} is situated in ${era}.`,
    sceneHead ? `Scene focus: ${sceneHead}` : null,
    nonEmpty(input.scene.narrativeIntent)
      ? `Stated narrative intent: ${input.scene.narrativeIntent}`
      : null,
    nonEmpty(input.scene.emotionalTone)
      ? `Author tonal tag: ${input.scene.emotionalTone}`
      : null,
    nonEmpty(input.state?.currentMask)
      ? `Presentational stance (mask): ${input.state?.currentMask}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const activeMotives: string[] = [];
  const pushUnique = (arr: string[], v: string | null | undefined) => {
    const t = nonEmpty(v);
    if (t && !arr.includes(t)) arr.push(t);
  };

  pushUnique(activeMotives, input.state?.currentDesire);
  pushUnique(activeMotives, input.state?.currentHope);
  pushUnique(activeMotives, input.legacySimulationState?.motivation);
  for (const line of jsonToLines(input.coreProfile?.privateDesiresJson, 8)) {
    pushUnique(activeMotives, line);
  }
  for (const line of jsonToLines(input.literaryProfile?.desires, 8)) {
    pushUnique(activeMotives, line);
  }
  for (const line of jsonToLines(input.legacySimulationState?.structuredDataJson, 4)) {
    pushUnique(activeMotives, line);
  }

  const suppressedMotives: string[] = [];
  pushUnique(suppressedMotives, input.state?.currentShame);
  pushUnique(suppressedMotives, input.state?.currentContradiction);
  for (const line of jsonToLines(input.coreProfile?.identityTensionsJson, 8)) {
    pushUnique(suppressedMotives, line);
  }
  for (const line of jsonToLines(input.literaryProfile?.internalConflicts, 6)) {
    pushUnique(suppressedMotives, line);
  }

  const fearStack: { rank: number; label: string }[] = [];
  {
    let rank = 1;
    const pushFear = (label: string | null | undefined) => {
      const t = nonEmpty(label);
      if (!t) return;
      if (fearStack.some((x) => x.label === t)) return;
      fearStack.push({ rank: rank++, label: t });
    };
    pushFear(input.state?.currentFear);
    pushFear(input.state?.currentSocialRisk);
    pushFear(input.state?.currentStatusVulnerability);
    for (const line of jsonToLines(input.literaryProfile?.fears, 6)) {
      pushFear(line);
    }
    pushFear(input.literaryProfile?.coreFear ?? undefined);
    pushFear(input.legacySimulationState?.fearState);
    pushFear(input.legacySimulationState?.socialConstraint);
  }

  const obligationStack: { rank: number; label: string }[] = [];
  {
    let rank = 1;
    const pushOb = (label: string | null | undefined) => {
      const t = nonEmpty(label);
      if (!t) return;
      if (obligationStack.some((x) => x.label === t)) return;
      obligationStack.push({ rank: rank++, label: t });
    };
    pushOb(input.state?.currentObligation);
    for (const a of input.relevantAssertions) {
      if (obligationStack.length >= 10) break;
      const slotLabel = a.slot?.label?.toLowerCase() ?? "";
      const blob = JSON.stringify(a.valueJson ?? {});
      const looksKin =
        slotLabel.includes("kin") ||
        slotLabel.includes("parent") ||
        slotLabel.includes("child") ||
        blob.toLowerCase().includes("obligation");
      if (looksKin || slotLabel.includes("status") || slotLabel.includes("free")) {
        pushOb(blob.length > 240 ? `${blob.slice(0, 240)}…` : blob);
      }
    }
    for (const r of input.relationships) {
      if (obligationStack.length >= 14) break;
      const tag = [r.relationshipType, r.relationshipSummary, r.notes]
        .filter(Boolean)
        .join(" — ");
      pushOb(tag);
    }
  }

  const identityConflict = [
    nonEmpty(input.state?.currentContradiction),
    ...jsonToLines(input.coreProfile?.identityTensionsJson, 3),
    ...jsonToLines(input.literaryProfile?.internalConflicts, 3),
    nonEmpty(input.literaryProfile?.contradictions),
  ]
    .filter(Boolean)
    .join(" | ");

  const decisionBiases: string[] = [];
  const pushBias = (v: string | null | undefined) => {
    const t = nonEmpty(v);
    if (t && !decisionBiases.includes(t)) decisionBiases.push(t);
  };
  pushBias(input.coreProfile?.attachmentStyle ?? undefined);
  for (const k of decisionStyleLabels(input.coreProfile?.decisionStyleJson)) {
    pushBias(k);
  }
  for (const line of jsonToLines(input.coreProfile?.defenseMechanismsJson, 8)) {
    pushBias(line);
  }
  pushBias(input.literaryProfile?.conflictStyle ?? undefined);
  pushBias(input.literaryProfile?.defensiveStyle ?? undefined);
  pushBias(input.literaryProfile?.attachmentPattern ?? undefined);

  return {
    perceivedReality,
    activeMotives,
    suppressedMotives,
    fearStack,
    obligationStack,
    identityConflict: identityConflict || "—",
    decisionBiases,
  };
}
