import type { CharacterMindProfile } from "@/lib/domain/character-mind";
import type { CharacterVoiceProfile } from "@/lib/domain/character-voice";
import type {
  CharacterSimulationFieldStatus,
  CharacterSimulationFieldStatusSource,
  CharacterSimulationProvenanceRecord,
} from "@/lib/domain/character-simulation-workbench";

function seedAtIso(): string {
  return new Date().toISOString();
}

function mindGroupTouched(
  group: string,
  author: Partial<CharacterMindProfile>,
  seed: CharacterMindProfile,
  merged: CharacterMindProfile
): { source: CharacterSimulationFieldStatusSource; authorTouched: boolean; differsFromSeed: boolean } {
  const keysByGroup: Record<string, (keyof CharacterMindProfile)[]> = {
    desire: ["coreDesire", "surfaceDesire"],
    fear: ["fearProfile"],
    wound: ["woundProfile"],
    shame: ["shameProfile"],
    pride: ["prideProfile"],
    belief: ["beliefSystem"],
    identity: ["identityNarrative"],
    behavior: ["selfDeceptionPatterns", "survivalStrategy", "attachmentStyle", "conflictStyle", "decisionStyle", "changeResistance"],
    stress: ["breakingPointConditions", "emotionalSuppressionStyle"],
    maps: ["moralBoundaryMap", "perceptionBiasMap", "memoryWeightMap"],
    worldview: ["worldviewFrame"],
  };
  const keys = keysByGroup[group] ?? [];
  const touched = keys.some((k) => author[k] !== undefined);
  const differs = keys.some((k) => JSON.stringify(merged[k]) !== JSON.stringify(seed[k]));
  const source: CharacterSimulationFieldStatusSource = touched ? "author_bundle" : "seed_derivation";
  return { source, authorTouched: touched, differsFromSeed: differs };
}

function voiceGroupTouched(
  group: string,
  author: Partial<CharacterVoiceProfile>,
  seed: CharacterVoiceProfile,
  merged: CharacterVoiceProfile
): { source: CharacterSimulationFieldStatusSource; authorTouched: boolean; differsFromSeed: boolean } {
  const keysByGroup: Record<string, (keyof CharacterVoiceProfile)[]> = {
    monologue: ["internalMonologueStyle", "spokenDialogueStyle"],
    rhythm: ["silencePattern", "cadenceProfile", "stressVoiceShiftPattern"],
    texture: ["metaphorDomain", "vocabularyRange", "emotionalExpressionStyle", "deflectionPattern"],
    boundaries: ["tabooBoundaries"],
    relation_speech: ["conflictSpeechPattern", "intimacySpeechPattern", "powerSpeechPattern"],
  };
  const keys = keysByGroup[group] ?? [];
  const touched = keys.some((k) => author[k] !== undefined);
  const differs = keys.some((k) => JSON.stringify(merged[k]) !== JSON.stringify(seed[k]));
  const source: CharacterSimulationFieldStatusSource = touched ? "author_bundle" : "seed_derivation";
  return { source, authorTouched: touched, differsFromSeed: differs };
}

export function buildCharacterSimulationFieldStatuses(input: {
  seedMind: CharacterMindProfile;
  seedVoice: CharacterVoiceProfile;
  authorMindPartial: Partial<CharacterMindProfile>;
  authorVoicePartial: Partial<CharacterVoiceProfile>;
  mergedMind: CharacterMindProfile;
  mergedVoice: CharacterVoiceProfile;
}): CharacterSimulationFieldStatus[] {
  const mindGroups: Array<{ id: string; label: string }> = [
    { id: "desire", label: "Desire stack" },
    { id: "fear", label: "Fear profile" },
    { id: "wound", label: "Wound profile" },
    { id: "shame", label: "Shame profile" },
    { id: "pride", label: "Pride profile" },
    { id: "belief", label: "Belief system" },
    { id: "identity", label: "Identity narrative" },
    { id: "behavior", label: "Behavior / attachment / decisions" },
    { id: "stress", label: "Stress / breaking points" },
    { id: "maps", label: "Moral / perception / memory maps" },
    { id: "worldview", label: "Worldview frame" },
  ];
  const voiceGroups: Array<{ id: string; label: string }> = [
    { id: "monologue", label: "Monologue & dialogue" },
    { id: "rhythm", label: "Rhythm & silence" },
    { id: "texture", label: "Texture & metaphor" },
    { id: "boundaries", label: "Taboo boundaries" },
    { id: "relation_speech", label: "Relational speech modes" },
  ];

  const out: CharacterSimulationFieldStatus[] = [];
  for (const g of mindGroups) {
    const r = mindGroupTouched(g.id, input.authorMindPartial, input.seedMind, input.mergedMind);
    out.push({
      fieldGroup: `mind.${g.id}`,
      label: g.label,
      source: r.source,
      authorTouched: r.authorTouched,
      differsFromSeed: r.differsFromSeed,
    });
  }
  for (const g of voiceGroups) {
    const r = voiceGroupTouched(g.id, input.authorVoicePartial, input.seedVoice, input.mergedVoice);
    out.push({
      fieldGroup: `voice.${g.id}`,
      label: g.label,
      source: r.source,
      authorTouched: r.authorTouched,
      differsFromSeed: r.differsFromSeed,
    });
  }
  return out;
}

export function buildCharacterSimulationProvenanceTimeline(input: {
  bundleUpdatedAtIso: string | null;
  hasAuthorMind: boolean;
  hasAuthorVoice: boolean;
}): CharacterSimulationProvenanceRecord[] {
  const t = seedAtIso();
  const rows: CharacterSimulationProvenanceRecord[] = [
    {
      id: "prov_seed",
      subject: "Deterministic seed",
      source: "seed_derivation",
      detail: "CharacterMindSeedService builds baseline mind/voice from person id + display label.",
      recordedAtIso: t,
    },
  ];
  if (input.hasAuthorMind || input.hasAuthorVoice) {
    rows.push({
      id: "prov_author",
      subject: "Author bundle",
      source: "author_bundle",
      detail: "Persisted partials on CharacterSimulationAuthorBundle merged via CharacterMindSeedService.merge*.",
      recordedAtIso: input.bundleUpdatedAtIso ?? t,
    });
  } else {
    rows.push({
      id: "prov_fallback",
      subject: "No author bundle payload",
      source: "fallback_default",
      detail: "Runtime uses deterministic seed only until author JSON is saved.",
      recordedAtIso: t,
    });
  }
  rows.push({
    id: "prov_runtime",
    subject: "Canonical runtime",
    source: "runtime_derivation",
    detail: "CharacterSimulationRuntimeDerivationService consumes merged profiles on scene generation input.",
    recordedAtIso: t,
  });
  return rows;
}
