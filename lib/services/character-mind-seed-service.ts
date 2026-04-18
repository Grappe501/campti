import { CharacterMindProfileSchema, type CharacterMindProfile } from "@/lib/domain/character-mind";
import { CharacterVoiceProfileSchema, type CharacterVoiceProfile } from "@/lib/domain/character-voice";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, i: number): T {
  return arr[(seed + i) % arr.length]!;
}

function mergeMindProfile(base: CharacterMindProfile, patch: Partial<CharacterMindProfile>): CharacterMindProfile {
  return {
    ...base,
    ...patch,
    fearProfile: patch.fearProfile ? { ...base.fearProfile, ...patch.fearProfile } : base.fearProfile,
    woundProfile: patch.woundProfile ? { ...base.woundProfile, ...patch.woundProfile } : base.woundProfile,
    shameProfile: patch.shameProfile ? { ...base.shameProfile, ...patch.shameProfile } : base.shameProfile,
    prideProfile: patch.prideProfile ? { ...base.prideProfile, ...patch.prideProfile } : base.prideProfile,
    beliefSystem: patch.beliefSystem
      ? {
          ...base.beliefSystem,
          ...patch.beliefSystem,
          coreBeliefs: patch.beliefSystem.coreBeliefs ?? base.beliefSystem.coreBeliefs,
          brittleAssumptions: patch.beliefSystem.brittleAssumptions ?? base.beliefSystem.brittleAssumptions,
        }
      : base.beliefSystem,
    selfDeceptionPatterns: patch.selfDeceptionPatterns ?? base.selfDeceptionPatterns,
    breakingPointConditions: patch.breakingPointConditions ?? base.breakingPointConditions,
    moralBoundaryMap: patch.moralBoundaryMap ? { ...base.moralBoundaryMap, ...patch.moralBoundaryMap } : base.moralBoundaryMap,
    perceptionBiasMap: patch.perceptionBiasMap
      ? { ...base.perceptionBiasMap, ...patch.perceptionBiasMap }
      : base.perceptionBiasMap,
    memoryWeightMap: patch.memoryWeightMap ? { ...base.memoryWeightMap, ...patch.memoryWeightMap } : base.memoryWeightMap,
    characterId: base.characterId,
  };
}

function mergeVoiceProfile(base: CharacterVoiceProfile, patch: Partial<CharacterVoiceProfile>): CharacterVoiceProfile {
  return {
    ...base,
    ...patch,
    tabooBoundaries: patch.tabooBoundaries ?? base.tabooBoundaries,
    characterId: base.characterId,
  };
}

/**
 * Deterministic mind/voice seeds (fallback). Cluster 9: author rows in `CharacterSimulationAuthorBundle` hydrate via merge.
 */
export class CharacterMindSeedService {
  /** Overlay author-owned JSON on the deterministic seed (invalid patch fields are ignored). */
  mergeMindProfile(base: CharacterMindProfile, patch: unknown): CharacterMindProfile {
    const parsed = CharacterMindProfileSchema.partial().safeParse(patch);
    if (!parsed.success) return base;
    return mergeMindProfile(base, parsed.data);
  }

  mergeVoiceProfile(base: CharacterVoiceProfile, patch: unknown): CharacterVoiceProfile {
    const parsed = CharacterVoiceProfileSchema.partial().safeParse(patch);
    if (!parsed.success) return base;
    return mergeVoiceProfile(base, parsed.data);
  }

  buildMindProfile(input: { characterId: string; displayLabel?: string | null }): CharacterMindProfile {
    const id = input.characterId;
    const seed = hashString(id);
    const label = input.displayLabel?.trim() || id.replace(/-/g, " ");

    return {
      characterId: id,
      coreDesire: `${label} wants continuity that does not cost the household its name.`,
      surfaceDesire: pick(
        ["keep the peace", "control the ledger", "hide the wound", "win the room", "earn one night's sleep"],
        seed,
        0,
      ),
      fearProfile: {
        primaryFearId: `fear_${seed % 5}`,
        secondaryFearIds: [`fear_sec_${(seed + 1) % 4}`, `fear_sec_${(seed + 2) % 4}`],
        fearActivationThreshold: 0.35 + (seed % 40) / 100,
        fearAvoidanceMoves: ["deflect with work", "go silent", "change subject to weather", "perform competence"],
      },
      woundProfile: {
        woundId: `wound_${seed % 7}`,
        originSummary: "An old public humiliation still steers risk appetite.",
        triggerCues: ["raised voice from authority", "being watched at the threshold", "paper with seals"],
        compulsionLoop: "Over-prepare, then resent being unseen.",
      },
      shameProfile: {
        shameObject: "Needing help",
        publicMask: "Self-sufficiency",
        privateLeakVector: "Hands shake when asked direct questions.",
      },
      prideProfile: {
        prideAnchor: "Reliability under pressure",
        humiliationRisk: "Being treated as naive",
      },
      beliefSystem: {
        coreBeliefs: ["Order is mercy", "Names carry debt", "Silence is safer than wrong speech"],
        brittleAssumptions: ["If I control information, I control harm"],
      },
      identityNarrative: `${label} tells themselves they are the one who holds the line.`,
      selfDeceptionPatterns: ["moralizes avoidance as prudence", "calls fear 'realism'"],
      survivalStrategy: pick(["compliance with pockets of secrecy", "humor armor", "task hyperfocus"], seed, 1),
      attachmentStyle: pick(["anxious", "avoidant", "disorganized", "secure_enough"], seed, 2),
      conflictStyle: pick(["indirect", "explosive_then_withdraw", "frozen", "repair_first"], seed, 3),
      decisionStyle: pick(["slow_certainty", "impulse_then_regret", "delegated", "legalistic"], seed, 4),
      changeResistance: Math.min(1, 0.45 + (seed % 35) / 100),
      breakingPointConditions: ["public accusation without warning", "child endangered", "forced oath"],
      moralBoundaryMap: {
        kin: "Will lie to outsiders to protect household truth.",
        ledger: "Will not forge numbers even under threat.",
      },
      emotionalSuppressionStyle: pick(["physical labor", "jokes", "religion-as-cover", "sleep deprivation"], seed, 5),
      perceptionBiasMap: {
        authority: "Reads neutral faces as judgment.",
        peers: "Overweights slights; underweights kindness.",
      },
      memoryWeightMap: {
        last_public_failure: 0.82,
        first_success: 0.35,
      },
      worldviewFrame: "The world rewards those who never look surprised.",
    };
  }

  buildVoiceProfile(input: { characterId: string; displayLabel?: string | null }): CharacterVoiceProfile {
    const seed = hashString(input.characterId);
    const label = input.displayLabel?.trim() || input.characterId;
    return {
      characterId: input.characterId,
      internalMonologueStyle: `${label} thinks in chores, weather, and debt — not abstract ethics.`,
      spokenDialogueStyle: "Short clauses; hedges before risk; avoids naming the fear directly.",
      silencePattern: "Answers late when the body disagrees with the mouth.",
      deflectionPattern: "Returns to practical tasks when intimacy approaches.",
      emotionalExpressionStyle: "Embodied: jaw, breath, hands before words.",
      metaphorDomain: pick(["animals", "weather", "tools", "food", "roads"], seed, 0).toString(),
      cadenceProfile: pick(["staccato under stress", "longer winding when safe"], seed, 1).toString(),
      vocabularyRange: pick(["narrow", "medium", "wide"] as const, seed, 2),
      tabooBoundaries: ["modern therapy jargon", "anachronistic psychology labels"],
      conflictSpeechPattern: "Becomes formal when cornered; informal when winning.",
      intimacySpeechPattern: "Lowers volume; fewer metaphors; more imperatives as care.",
      powerSpeechPattern: "Uses questions as blades; avoids naked commands until dominance is settled.",
      stressVoiceShiftPattern: "Sentences shorten; pronouns thin out; silence lengthens.",
    };
  }
}
