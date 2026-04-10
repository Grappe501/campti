import type { ConstitutionalRule, RuleType } from "@prisma/client";

/** Row in `ConstitutionalRule`; policy “models” (TruthPolicy, VoicePolicy, …) are typed rows, not separate tables. */
export type ConstitutionalRuleRecord = ConstitutionalRule;

export type ConstitutionalValidationContext = {
  sceneId?: string;
  metaSceneId?: string;
  characterId?: string;
  branchId?: string;
  voiceProfileId?: string;
  /** Arbitrary payload shape for future engines (draft readiness, claims, etc.). */
  payload?: unknown;
};

export type RuleValidationResult = {
  ok: boolean;
  warnings: string[];
  blocking: string[];
};

export type RuleTypeFilter = RuleType | "ALL";
