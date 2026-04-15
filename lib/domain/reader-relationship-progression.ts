/**
 * P3-N — Derived character↔reader relationship progression from bounded interaction history.
 */
export type ReaderRelationshipState =
  | "stranger"
  | "recognized"
  | "familiar"
  | "trusted"
  | "confidant";

export type ReaderRelationshipProgression = {
  relationshipState: ReaderRelationshipState;
  directnessLevel: "guarded" | "measured" | "open" | "frank";
  vulnerabilityAllowance: "minimal" | "limited" | "moderate" | "high";
  disclosureComfortBand: "none" | "basic" | "personal" | "intimate";
  greetingStyleHint: string;
  familiarityLevel: number;
  interactionCount: number;
  keyDisclosureCount: number;
};
