/**
 * Regression check for `inferSceneReadinessClassFromSignals` fixtures.
 * Run: npx tsx scripts/verify-stage8-classification.ts
 */
import { inferSceneReadinessClassFromSignals } from "@/lib/scene-structured-data-patch";
import { STAGE8_SCENE_CLASSIFICATION_FIXTURES } from "@/lib/stage8-evaluation-fixtures";

let failed = 0;
for (const f of STAGE8_SCENE_CLASSIFICATION_FIXTURES) {
  const got = inferSceneReadinessClassFromSignals(f.input);
  if (got !== f.expectedClass) {
    console.error(`FAIL ${f.id}: expected ${f.expectedClass}, got ${got} (${f.note})`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK ${STAGE8_SCENE_CLASSIFICATION_FIXTURES.length} Stage 8 scene-classification fixtures`);
