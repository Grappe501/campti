import type { Prisma } from "@prisma/client";

/**
 * Domain mirror of `NarrativeSource` (Prisma). String fields use enums in TS at boundaries;
 * persistence stores plain strings per schema.
 */
export enum NarrativeSourceScope {
  Global = "global",
  Regional = "regional",
  Family = "family",
  Character = "character",
}

export enum NarrativeSourceTruthMode {
  Authoritative = "authoritative",
  Interpretive = "interpretive",
  Fictionalized = "fictionalized",
}

export type NarrativeAuthorType = "steve" | "historical" | "other";

export type NarrativeSource = {
  id: string;
  title: string;
  authorType: string;
  createdAt: Date;

  effectiveStartWorldStateId: string;
  effectiveEndWorldStateId: string | null;

  startYear: number | null;
  endYear: number | null;

  scope: string;
  truthMode: string;

  tags: string[];
  content: string;

  metadataJson: Prisma.JsonValue | null;
};
