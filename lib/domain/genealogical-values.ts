import type { GenealogicalPredicate } from "@prisma/client";
import { z } from "zod";

/** Stable string for polymorphic subject rows (Person is primary). */
export const GENEALOGICAL_SUBJECT_PERSON = "Person" as const;

const yearValue = z.object({
  kind: z.literal("year"),
  year: z.number().int(),
  circa: z.boolean().optional(),
});

const placeRef = z.object({
  kind: z.literal("place_ref"),
  placeId: z.string().min(1),
  label: z.string().optional(),
});

const personRef = z.object({
  kind: z.literal("person_ref"),
  personId: z.string().min(1),
  label: z.string().optional(),
});

const stringValue = z.object({
  kind: z.literal("string"),
  value: z.string(),
});

const freedomStatus = z.object({
  kind: z.literal("freedom_status"),
  status: z.enum([
    "enslaved",
    "free",
    "free_people_of_color",
    "indentured",
    "unknown",
    "contested",
  ]),
  asOfDate: z.string().optional(),
  notes: z.string().optional(),
});

const landTenure = z.object({
  kind: z.literal("land_tenure"),
  description: z.string(),
  placeId: z.string().optional(),
  asOfDate: z.string().optional(),
});

const otherBlob = z.object({
  kind: z.literal("other"),
  payload: z.record(z.string(), z.unknown()),
});

export const genealogicalValueSchema = z.discriminatedUnion("kind", [
  yearValue,
  placeRef,
  personRef,
  stringValue,
  freedomStatus,
  landTenure,
  otherBlob,
]);

export type GenealogicalValueJson = z.infer<typeof genealogicalValueSchema>;

const predicateValuePairs: Record<GenealogicalPredicate, z.ZodType<unknown>> = {
  BIRTH_YEAR: yearValue,
  DEATH_YEAR: yearValue,
  BIRTH_PLACE: placeRef,
  DEATH_PLACE: placeRef,
  BURIAL_PLACE: placeRef,
  FATHER_ID: personRef,
  MOTHER_ID: personRef,
  FREEDOM_STATUS: freedomStatus,
  RACIAL_CLASSIFICATION_RECORDED: stringValue,
  ENSLAVED_NAME: stringValue,
  FREE_NAME: stringValue,
  UNION_SPOUSE_ID: personRef,
  RESIDENCE_AT_DATE: z.object({
    kind: z.literal("residence"),
    placeId: z.string().min(1),
    asOfDate: z.string().optional(),
    label: z.string().optional(),
  }),
  LAND_TENURE: landTenure,
  OTHER: otherBlob,
};

export function parseAssertionValue(
  predicate: GenealogicalPredicate,
  valueJson: unknown
): unknown {
  const schema = predicateValuePairs[predicate];
  return schema.parse(valueJson);
}

export function safeParseAssertionValue(
  predicate: GenealogicalPredicate,
  valueJson: unknown
) {
  const schema = predicateValuePairs[predicate];
  return schema.safeParse(valueJson);
}
