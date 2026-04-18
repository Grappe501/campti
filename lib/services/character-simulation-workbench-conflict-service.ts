import type { CharacterMindProfile } from "@/lib/domain/character-mind";
import type { CharacterVoiceProfile } from "@/lib/domain/character-voice";
import type {
  CharacterSimulationConflict,
  CharacterSimulationConflictCategory,
  CharacterSimulationConflictSeverity,
  CharacterSimulationWorkbenchMeta,
} from "@/lib/domain/character-simulation-workbench";

function hashId(parts: string[]): string {
  const s = parts.join("|");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `csim_${Math.abs(h).toString(16)}`;
}

function excerpt(v: string | null | undefined, max = 220): string | null {
  if (!v?.trim()) return null;
  const t = v.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

function jaccardDisagreement(a: string, b: string): number {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) {
    if (B.has(t)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union ? 1 - inter / union : 0;
}

function authorVoiceInternalMonologueStyleClash(author: Partial<CharacterVoiceProfile>, seed: CharacterVoiceProfile): boolean {
  if (!author.internalMonologueStyle) return false;
  return jaccardDisagreement(author.internalMonologueStyle, seed.internalMonologueStyle) > 0.65;
}

function push(
  out: CharacterSimulationConflict[],
  input: Omit<CharacterSimulationConflict, "id" | "acceptedByOperator"> & { category: CharacterSimulationConflictCategory },
  accepted: Set<string>
) {
  const id = hashId([input.category, ...input.affectedFields, input.description.slice(0, 80)]);
  out.push({
    ...input,
    id,
    acceptedByOperator: accepted.has(id),
  });
}

/**
 * Compare author-owned partials against deterministic seed (derived baseline).
 * Heuristic, explainable — not a second runtime merge engine.
 */
export function detectCharacterSimulationConflicts(input: {
  seedMind: CharacterMindProfile;
  seedVoice: CharacterVoiceProfile;
  authorMindPartial: Partial<CharacterMindProfile>;
  authorVoicePartial: Partial<CharacterVoiceProfile>;
  meta: CharacterSimulationWorkbenchMeta;
  personBirthYear: number | null;
  personDeathYear: number | null;
}): CharacterSimulationConflict[] {
  const accepted = new Set(input.meta.acceptedConflictIds ?? []);
  const out: CharacterSimulationConflict[] = [];

  const mergedMindPreview = { ...input.seedMind, ...input.authorMindPartial } as CharacterMindProfile;
  const mergedVoicePreview = { ...input.seedVoice, ...input.authorVoicePartial } as CharacterVoiceProfile;

  if (input.authorMindPartial.worldviewFrame && input.seedMind.worldviewFrame) {
    const d = jaccardDisagreement(input.authorMindPartial.worldviewFrame, input.seedMind.worldviewFrame);
    if (d > 0.72) {
      push(
        out,
        {
          category: "worldview_conflict",
          severity: "warning",
          affectedFields: ["worldviewFrame"],
          description:
            "Author worldview frame diverges strongly from the deterministic seed frame. Merged runtime will follow author text — confirm this is intentional continuity.",
          recommendedRemediation: "Align worldviewFrame with seed, or document the deliberate rewrite in author notes.",
          sourceComparison: {
            authorExcerpt: excerpt(input.authorMindPartial.worldviewFrame),
            derivedExcerpt: excerpt(input.seedMind.worldviewFrame),
          },
          blocksGenerationReadiness: false,
        },
        accepted,
      );
    }
  }

  if (input.authorMindPartial.coreDesire && input.seedMind.coreDesire) {
    const d = jaccardDisagreement(input.authorMindPartial.coreDesire, input.seedMind.coreDesire);
    if (d > 0.75) {
      push(
        out,
        {
          category: "motivation_conflict",
          severity: "advisory",
          affectedFields: ["coreDesire"],
          description: "Author core desire wording is far from seed-derived desire; merged output prioritizes author.",
          recommendedRemediation: "Reconcile coreDesire with scene necessity, or accept as deliberate override.",
          sourceComparison: {
            authorExcerpt: excerpt(input.authorMindPartial.coreDesire),
            derivedExcerpt: excerpt(input.seedMind.coreDesire),
          },
          blocksGenerationReadiness: false,
        },
        accepted,
      );
    }
  }

  if (input.authorMindPartial.conflictStyle && input.seedMind.conflictStyle) {
    const a = input.authorMindPartial.conflictStyle.toLowerCase();
    const b = input.seedMind.conflictStyle.toLowerCase();
    if ((a.includes("explosive") && b.includes("frozen")) || (a.includes("frozen") && b.includes("explosive"))) {
      push(
        out,
        {
          category: "temperament_conflict",
          severity: "warning",
          affectedFields: ["conflictStyle"],
          description: "Author conflict style is temperamentally opposite to the seed-derived style.",
          recommendedRemediation: "Pick one posture as canon or soften the author patch to a compatible variant.",
          sourceComparison: {
            authorExcerpt: excerpt(input.authorMindPartial.conflictStyle),
            derivedExcerpt: excerpt(input.seedMind.conflictStyle),
          },
          blocksGenerationReadiness: false,
        },
        accepted,
      );
    }
  }

  if (input.authorMindPartial.emotionalSuppressionStyle && input.seedMind.fearProfile?.fearAvoidanceMoves?.length) {
    const emo = input.authorMindPartial.emotionalSuppressionStyle.toLowerCase();
    const moves = input.seedMind.fearProfile.fearAvoidanceMoves.join(" ").toLowerCase();
    if (emo.includes("perform") && moves.includes("silent") && moves.includes("deflect")) {
      push(
        out,
        {
          category: "stress_response_conflict",
          severity: "advisory",
          affectedFields: ["emotionalSuppressionStyle", "fearProfile.fearAvoidanceMoves"],
          description: "Author suppression posture may fight the seed fear-avoidance choreography under pressure.",
          recommendedRemediation: "Tune emotionalSuppressionStyle or adjust fear avoidance moves for coherent stress arc.",
          sourceComparison: {
            authorExcerpt: excerpt(input.authorMindPartial.emotionalSuppressionStyle),
            derivedExcerpt: excerpt(input.seedMind.fearProfile.fearAvoidanceMoves.join("; ")),
          },
          blocksGenerationReadiness: false,
        },
        accepted,
      );
    }
  }

  if (input.authorVoicePartial.vocabularyRange && input.authorVoicePartial.vocabularyRange !== input.seedVoice.vocabularyRange) {
    const sev: CharacterSimulationConflictSeverity = authorVoiceInternalMonologueStyleClash(input.authorVoicePartial, input.seedVoice)
      ? "warning"
      : "advisory";
    push(
      out,
      {
        category: "voice_register_conflict",
        severity: sev,
        affectedFields: ["vocabularyRange", "internalMonologueStyle"],
        description: "Author vocabulary register differs from seed; combined with monologue texture this may read unevenly.",
        recommendedRemediation: "Align vocabularyRange with monologue density, or narrow metaphor domain to match register.",
        sourceComparison: {
          authorExcerpt: `${input.authorVoicePartial.vocabularyRange}`,
          derivedExcerpt: `${input.seedVoice.vocabularyRange}`,
        },
        blocksGenerationReadiness: false,
      },
      accepted,
    );
  }

  if (input.authorVoicePartial.conflictSpeechPattern && input.seedVoice.conflictSpeechPattern) {
    const d = jaccardDisagreement(input.authorVoicePartial.conflictSpeechPattern, input.seedVoice.conflictSpeechPattern);
    if (d > 0.7) {
      push(
        out,
        {
          category: "speech_pattern_mismatch",
          severity: "advisory",
          affectedFields: ["conflictSpeechPattern"],
          description: "Author conflict speech pattern diverges from seed; runtime merge prefers author strings.",
          recommendedRemediation: "Keep one register under stress, or document intentional code-switching.",
          sourceComparison: {
            authorExcerpt: excerpt(input.authorVoicePartial.conflictSpeechPattern),
            derivedExcerpt: excerpt(input.seedVoice.conflictSpeechPattern),
          },
          blocksGenerationReadiness: false,
        },
        accepted,
      );
    }
  }

  if (input.authorMindPartial.identityNarrative && input.seedMind.identityNarrative) {
    const d = jaccardDisagreement(input.authorMindPartial.identityNarrative, input.seedMind.identityNarrative);
    if (d > 0.78) {
      push(
        out,
        {
          category: "identity_anchor_conflict",
          severity: "warning",
          affectedFields: ["identityNarrative"],
          description: "Author identity narrative diverges sharply from seed identity anchor.",
          recommendedRemediation: "Reconcile identity narrative with continuity facts, or accept as deliberate retcon (document in notes).",
          sourceComparison: {
            authorExcerpt: excerpt(input.authorMindPartial.identityNarrative),
            derivedExcerpt: excerpt(input.seedMind.identityNarrative),
          },
          blocksGenerationReadiness: false,
        },
        accepted,
      );
    }
  }

  if (input.personBirthYear != null && input.personDeathYear != null && input.personBirthYear > input.personDeathYear) {
    push(
      out,
      {
        category: "timeline_truth_conflict",
        severity: "blocking",
        affectedFields: ["person.birthYear", "person.deathYear"],
        description: "Person chronology is impossible (birth year after death year). Simulation previews remain low-trust.",
        recommendedRemediation: "Fix person years before treating simulation as execution-grade.",
        sourceComparison: {
          authorExcerpt: `${input.personBirthYear}–${input.personDeathYear}`,
          derivedExcerpt: null,
        },
        blocksGenerationReadiness: true,
      },
      accepted,
    );
  }

  const belief = input.authorMindPartial.beliefSystem;
  if (belief && Array.isArray(belief.coreBeliefs) && belief.coreBeliefs.length === 0) {
    push(
      out,
      {
        category: "merged_profile_instability",
        severity: "blocking",
        affectedFields: ["beliefSystem.coreBeliefs"],
        description: "Author patch sets core beliefs to an empty array — merged belief system becomes structurally hollow.",
        recommendedRemediation: "Remove the patch key or supply at least one core belief.",
        sourceComparison: { authorExcerpt: "[]", derivedExcerpt: excerpt(input.seedMind.beliefSystem.coreBeliefs.join("; ")) },
        blocksGenerationReadiness: true,
      },
      accepted,
    );
  }

  if (belief && Array.isArray(belief.brittleAssumptions) && belief.brittleAssumptions.length > 24) {
    push(
      out,
      {
        category: "merged_profile_instability",
        severity: "warning",
        affectedFields: ["beliefSystem.brittleAssumptions"],
        description: "Very large brittle assumption list — runtime interpretability and preview confidence degrade.",
        recommendedRemediation: "Collapse into fewer load-bearing assumptions.",
        sourceComparison: {
          authorExcerpt: `${belief.brittleAssumptions.length} items`,
          derivedExcerpt: `${input.seedMind.beliefSystem.brittleAssumptions.length} items (seed)`,
        },
        blocksGenerationReadiness: false,
      },
      accepted,
    );
  }

  if (input.authorVoicePartial.tabooBoundaries && input.authorVoicePartial.tabooBoundaries.length === 0) {
    push(
      out,
      {
        category: "merged_profile_instability",
        severity: "warning",
        affectedFields: ["tabooBoundaries"],
        description: "Author patch clears taboo boundaries — voice governance weakens versus seed defaults.",
        recommendedRemediation: "Restore at least one taboo boundary or remove the patch key to inherit seed defaults.",
        sourceComparison: { authorExcerpt: "[]", derivedExcerpt: excerpt(input.seedVoice.tabooBoundaries.join("; ")) },
        blocksGenerationReadiness: false,
      },
      accepted,
    );
  }

  if (!mergedMindPreview.beliefSystem?.coreBeliefs?.length || !mergedVoicePreview.tabooBoundaries?.length) {
    push(
      out,
      {
        category: "merged_profile_instability",
        severity: "blocking",
        affectedFields: ["merged"],
        description: "Merged profile lost required nested structures — treat as data corruption until repaired.",
        recommendedRemediation: "Reset author partials or repair JSON via workbench guided forms.",
        sourceComparison: { authorExcerpt: JSON.stringify(Object.keys(input.authorMindPartial)), derivedExcerpt: "seed intact" },
        blocksGenerationReadiness: true,
      },
      accepted,
    );
  }

  return out;
}
