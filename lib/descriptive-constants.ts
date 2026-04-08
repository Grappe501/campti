/**
 * Descriptive mode labels (TypeScript; not a DB enum — keeps schema light).
 */
export const NarrativeRegister = {
  CLINICAL: "CLINICAL",
  LITERARY: "LITERARY",
  IMMERSIVE: "IMMERSIVE",
  EDITORIAL: "EDITORIAL",
  MINIMAL: "MINIMAL",
} as const;

export type NarrativeRegisterValue = (typeof NarrativeRegister)[keyof typeof NarrativeRegister];

/** Default blend for this phase: literary voice + editorial interpretation. */
export const DEFAULT_DESCRIPTIVE_MODE = "LITERARY_EDITORIAL" as const;
