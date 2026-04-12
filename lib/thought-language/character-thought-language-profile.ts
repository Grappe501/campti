import type { CharacterProfile } from "@prisma/client";

import type { CharacterCore } from "@/lib/domain/cognition";
import type {
  CodeSwitchTrigger,
  RegisterProfile,
  SpokenLanguageProfile,
  ThoughtLanguageProfile,
  TranslationRenderMode,
} from "@/lib/domain/thought-language";

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "object" && !Array.isArray(v)) return { ...fallback, ...(v as object) } as T;
  return fallback;
}

const emptySpoken: SpokenLanguageProfile = {
  languages: [{ code: "en", label: "English", fluency: "native" }],
};

const emptyRegister: RegisterProfile = {
  socialStance: [],
  hierarchyAwareness: "medium",
  indirectness: "medium",
};

export function buildCharacterThoughtLanguageProfile(
  core: CharacterCore | null,
  literaryProfile: CharacterProfile | null
): ThoughtLanguageProfile {
  const primary =
    (core?.mindLanguagePrimary?.trim() ||
      (literaryProfile?.speechPatterns ? "en" : null) ||
      "en") ?? "en";
  const secondary = core?.mindLanguageSecondary?.trim() || null;

  const spoken = parseJson<SpokenLanguageProfile>(
    core?.spokenLanguageProfileJson,
    emptySpoken
  );
  if (!spoken.languages?.length) {
    spoken.languages = [{ code: primary, label: primary, fluency: "native" }];
  }

  const register = parseJson<RegisterProfile>(core?.registerProfileJson, emptyRegister);

  const mode = (core?.translationRenderMode?.trim() as TranslationRenderMode | undefined) ?? "MEDIATED_ENGLISH";
  const validModes: TranslationRenderMode[] = [
    "TRANSPARENT_ENGLISH",
    "MEDIATED_ENGLISH",
    "HIGH_TEXTURE_ENGLISH",
  ];
  const translationRenderMode = validModes.includes(mode) ? mode : "MEDIATED_ENGLISH";

  let codeSwitchTriggers: CodeSwitchTrigger[] = [];
  if (Array.isArray(core?.codeSwitchTriggersJson)) {
    codeSwitchTriggers = (core!.codeSwitchTriggersJson as unknown[]).filter(
      (x): x is CodeSwitchTrigger =>
        x != null && typeof x === "object" && "id" in (x as object) && "condition" in (x as object)
    ) as CodeSwitchTrigger[];
  }

  let retainedLexicon: ThoughtLanguageProfile["retainedLexicon"] = [];
  if (Array.isArray(core?.retainedLexiconJson)) {
    retainedLexicon = (core!.retainedLexiconJson as unknown[]).filter(
      (x) => x != null && typeof x === "object" && "term" in (x as object)
    ) as ThoughtLanguageProfile["retainedLexicon"];
  }

  return {
    primaryMindLanguage: primary,
    secondaryMindLanguage: secondary,
    spoken,
    register,
    translationRenderMode,
    codeSwitchTriggers,
    retainedLexicon,
  };
}
