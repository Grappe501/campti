/**
 * Wires `lib/lineage/grappe-lineage-working.v1.json` into `Person`:
 * - Sets `lineageWorkingId` + years + name on existing seed rows (Alexis, Buford).
 * - Upserts `person-lineage-{GRP-id}` for every other node.
 *
 *   npx tsx scripts/wire-grp-lineage-persons.ts
 */
import "./load-env";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { getGrappeLineageWorking } from "../lib/lineage";
import {
  getPersonIdForGrp,
  GRAPPE_GRP_TO_SEED_PERSON_ID,
} from "../lib/lineage/grappe-seed-overlap";
import { prisma } from "../lib/prisma";

function recordTypeForLineage(entityType: string): RecordType {
  return entityType === "lineage_cluster" ? RecordType.INFERRED : RecordType.HISTORICAL;
}

async function main() {
  const { people } = getGrappeLineageWorking();
  const n = people.length;

  await prisma.$transaction(async (tx) => {
    for (const p of people) {
      const id = getPersonIdForGrp(p.id);
      const trace = `grappe-lineage-working.v1.json · ${p.id} · entity_type=${p.entity_type} · ${p.lineage_branch}`;

      await tx.person.upsert({
        where: { id },
        update: {
          name: p.display_name,
          birthYear: p.birth_year ?? null,
          deathYear: p.death_year ?? null,
          lineageWorkingId: p.id,
          sourceTraceNote: trace,
          description: p.notes?.slice(0, 2000) ?? null,
          recordType: recordTypeForLineage(p.entity_type),
        },
        create: {
          id,
          name: p.display_name,
          birthYear: p.birth_year ?? null,
          deathYear: p.death_year ?? null,
          lineageWorkingId: p.id,
          sourceTraceNote: trace,
          description: p.notes?.slice(0, 2000) ?? null,
          visibility: VisibilityStatus.PUBLIC,
          recordType: recordTypeForLineage(p.entity_type),
        },
      });
    }
  });

  console.log(`Wired ${n} GRP nodes to Person rows. Seed overlaps:`, Object.keys(GRAPPE_GRP_TO_SEED_PERSON_ID).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
