/** GRP id → existing seed `Person.id` after wiring (`scripts/wire-grp-lineage-persons.ts`). */
export const GRAPPE_GRP_TO_SEED_PERSON_ID: Record<string, string> = {
  "GRP-0001": "seed-person-alexis",
  "GRP-0021": "seed-person-buford",
  "GRP-0040": "seed-person-francois",
};

export function getPersonIdForGrp(grpId: string): string {
  return GRAPPE_GRP_TO_SEED_PERSON_ID[grpId] ?? `person-lineage-${grpId}`;
}
