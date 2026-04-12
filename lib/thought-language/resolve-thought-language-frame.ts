import type { CharacterAgeBand } from "@/lib/domain/inner-voice";
import type { ThoughtLanguageFrame, ThoughtLanguageProfile, WorldStateLanguageEnvironment } from "@/lib/domain/thought-language";

import { rulesForMode } from "@/lib/thought-language/rendering-modes";

/**
 * Deterministic merge of character language profile, world environment, age, and coarse status signals.
 */
export function resolveThoughtLanguageFrame(input: {
  character: ThoughtLanguageProfile;
  world: WorldStateLanguageEnvironment;
  ageBand: CharacterAgeBand | null;
  /** Tags like "free", "enslaved", "clerical", "literate" from optional callers. */
  statusTags: string[];
  /** Scene intent for trigger hints (optional). */
  sceneNarrativeIntent: string | null;
}): ThoughtLanguageFrame {
  const { character, world, ageBand, statusTags, sceneNarrativeIntent } = input;
  const modeRules = rulesForMode(character.translationRenderMode);

  let retainedLexiconWeight = modeRules.retainedTermCap;
  let syntaxInfluenceLevel = modeRules.syntaxInfluenceCap;
  if (character.translationRenderMode === "HIGH_TEXTURE_ENGLISH") {
    retainedLexiconWeight = Math.min(1, retainedLexiconWeight + 0.05);
  }
  syntaxInfluenceLevel += world.translationPressure / 500;
  retainedLexiconWeight += world.translationPressure / 400;
  syntaxInfluenceLevel = Math.min(1, syntaxInfluenceLevel);
  retainedLexiconWeight = Math.min(1, retainedLexiconWeight);

  if (ageBand === "EARLY_CHILD" || ageBand === "LATE_CHILD") {
    syntaxInfluenceLevel *= 0.85;
    retainedLexiconWeight *= 0.9;
  }

  const accentTextureLevel =
    character.translationRenderMode === "TRANSPARENT_ENGLISH"
      ? ("none" as const)
      : character.translationRenderMode === "MEDIATED_ENGLISH"
        ? ("light" as const)
        : ("medium" as const);

  const triggers = [...character.codeSwitchTriggers];
  if (world.prestigeLanguage && world.prestigeLanguage !== character.primaryMindLanguage) {
    triggers.push({
      id: "prestige_surface",
      condition: "public_or_legal_face",
      kind: "prestige_language",
      toward: world.prestigeLanguage,
    });
  }
  if (world.sacredLanguage) {
    triggers.push({
      id: "sacred_register",
      condition: "prayer_oath_liturgy",
      kind: "sacred_language",
      toward: world.sacredLanguage,
    });
  }
  if (sceneNarrativeIntent?.toLowerCase().includes("market") || statusTags.includes("trade")) {
    if (world.tradeLanguage) {
      triggers.push({
        id: "trade_context",
        condition: "commerce_or_strangers",
        kind: "trade_language",
        toward: world.tradeLanguage,
      });
    }
  }

  const renderInstructions: string[] = [
    `Mind primary: ${character.primaryMindLanguage}; secondary: ${character.secondaryMindLanguage ?? "none"}.`,
    `World prestige: ${world.prestigeLanguage ?? "unset"}; sacred: ${world.sacredLanguage ?? "unset"}; legal: ${world.legalLanguage ?? "unset"}.`,
    `Render mode: ${character.translationRenderMode}. ${modeRules.notes}`,
    `Honorific preservation: ${modeRules.honorificPreservation}. Metaphor carryover: ${modeRules.metaphorCarryover}.`,
    `Register stance: ${character.register.socialStance.join(", ") || "unspecified"}; hierarchy awareness ${character.register.hierarchyAwareness}.`,
    `Literacy norm (era): ${world.literacyNorm.clericalLiteracy}; vernacular print: ${world.literacyNorm.vernacularPrint}.`,
    "Final output: English only for author/reader; preserve worldview, moral categories, metaphor systems, and social rank in content.",
    "Do not use crude phonetic spelling; use register, syntax, and retained key terms sparingly.",
  ];

  return {
    primaryMindLanguage: character.primaryMindLanguage,
    secondaryMindLanguage: character.secondaryMindLanguage,
    spoken: character.spoken,
    register: character.register,
    world,
    renderMode: character.translationRenderMode,
    accentTextureLevel,
    retainedLexiconWeight,
    syntaxInfluenceLevel,
    codeSwitchTriggers: triggers,
    renderInstructions,
  };
}
