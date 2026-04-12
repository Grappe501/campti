import type { WorldStateLanguageEnvironment } from "@/lib/domain/thought-language";

/** Default when DB has no `languageEnvironmentJson` yet. */
export function defaultWorldStateLanguageEnvironment(input: {
  worldStateId: string | null;
  eraId: string | null;
  label: string | null;
}): WorldStateLanguageEnvironment {
  return {
    worldStateId: input.worldStateId,
    eraId: input.eraId,
    dominantLanguages: [{ code: "en", label: "English (unset—author should configure)", notes: input.label ?? undefined }],
    prestigeLanguage: null,
    sacredLanguage: null,
    legalLanguage: null,
    tradeLanguage: null,
    householdLanguage: null,
    literacyNorm: {
      clericalLiteracy: "minority",
      vernacularPrint: false,
      notes: "Placeholder until `languageEnvironmentJson` is authored for this era.",
    },
    languageHierarchy: ["prestige_unset", "vernacular_unset"],
    translationPressure: 50,
  };
}

/**
 * Merge DB JSON with era label; invalid shapes fall back to defaults.
 */
export function buildWorldStateLanguageEnvironment(input: {
  worldStateId: string | null;
  eraId: string | null;
  label: string | null;
  languageEnvironmentJson: unknown;
}): WorldStateLanguageEnvironment {
  const base = defaultWorldStateLanguageEnvironment(input);
  const raw = input.languageEnvironmentJson;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;

  const o = raw as Record<string, unknown>;
  const dominant = o.dominantLanguages;
  const literacy = o.literacyNorm;

  return {
    worldStateId: input.worldStateId,
    eraId: typeof o.eraId === "string" ? o.eraId : input.eraId,
    dominantLanguages: Array.isArray(dominant)
      ? (dominant as WorldStateLanguageEnvironment["dominantLanguages"])
      : base.dominantLanguages,
    prestigeLanguage: typeof o.prestigeLanguage === "string" ? o.prestigeLanguage : base.prestigeLanguage,
    sacredLanguage: typeof o.sacredLanguage === "string" ? o.sacredLanguage : base.sacredLanguage,
    legalLanguage: typeof o.legalLanguage === "string" ? o.legalLanguage : base.legalLanguage,
    tradeLanguage: typeof o.tradeLanguage === "string" ? o.tradeLanguage : base.tradeLanguage,
    householdLanguage: typeof o.householdLanguage === "string" ? o.householdLanguage : base.householdLanguage,
    literacyNorm:
      literacy && typeof literacy === "object" && !Array.isArray(literacy)
        ? {
            clericalLiteracy:
              (literacy as { clericalLiteracy?: string }).clericalLiteracy === "rare" ||
              (literacy as { clericalLiteracy?: string }).clericalLiteracy === "minority" ||
              (literacy as { clericalLiteracy?: string }).clericalLiteracy === "common" ||
              (literacy as { clericalLiteracy?: string }).clericalLiteracy === "widespread"
                ? ((literacy as { clericalLiteracy?: string }).clericalLiteracy as WorldStateLanguageEnvironment["literacyNorm"]["clericalLiteracy"])
                : base.literacyNorm.clericalLiteracy,
            vernacularPrint: Boolean((literacy as { vernacularPrint?: boolean }).vernacularPrint),
            notes: typeof (literacy as { notes?: string }).notes === "string" ? (literacy as { notes: string }).notes : base.literacyNorm.notes,
          }
        : base.literacyNorm,
    languageHierarchy: Array.isArray(o.languageHierarchy)
      ? (o.languageHierarchy as string[]).filter((x) => typeof x === "string")
      : base.languageHierarchy,
    translationPressure:
      typeof o.translationPressure === "number" && Number.isFinite(o.translationPressure)
        ? Math.min(100, Math.max(0, o.translationPressure))
        : base.translationPressure,
  };
}
