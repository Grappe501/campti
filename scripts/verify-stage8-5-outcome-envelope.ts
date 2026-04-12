/**
 * Regression check for `buildSceneOutcomeEnvelope` fixtures (Stage 8.5).
 * Run: npx tsx scripts/verify-stage8-5-outcome-envelope.ts
 */
import { buildSceneOutcomeEnvelope } from "@/lib/scene-outcome-envelope-engine";
import type { OutcomeEnvelopeEntry } from "@/lib/scene-outcome-envelope-types";
import { STAGE85_OUTCOME_ENVELOPE_FIXTURES } from "@/lib/stage8-outcome-envelope-fixtures";

function someTextIncludes(entries: OutcomeEnvelopeEntry[], sub: string): boolean {
  return entries.some((e) => e.text.includes(sub));
}

function everyTextExcludes(entries: OutcomeEnvelopeEntry[], sub: string): boolean {
  return entries.every((e) => !e.text.includes(sub));
}

function someReasonIncludes(entries: OutcomeEnvelopeEntry[], sub: string): boolean {
  return entries.some((e) => (e.reason ?? "").includes(sub));
}

let failed = 0;

for (const f of STAGE85_OUTCOME_ENVELOPE_FIXTURES) {
  const env = buildSceneOutcomeEnvelope(f.input);
  const { expect: ex } = f;

  const checkIncludes = (
    bucket: string,
    entries: OutcomeEnvelopeEntry[],
    subs: string[] | undefined,
  ) => {
    if (!subs) return;
    for (const sub of subs) {
      if (!someTextIncludes(entries, sub)) {
        console.error(`FAIL ${f.id}: ${bucket} must include text containing "${sub}" (${f.note})`);
        failed += 1;
      }
    }
  };

  const checkExcludes = (
    bucket: string,
    entries: OutcomeEnvelopeEntry[],
    subs: string[] | undefined,
  ) => {
    if (!subs) return;
    for (const sub of subs) {
      if (!everyTextExcludes(entries, sub)) {
        console.error(`FAIL ${f.id}: ${bucket} must not include "${sub}" (${f.note})`);
        failed += 1;
      }
    }
  };

  const checkReasons = (
    bucket: string,
    entries: OutcomeEnvelopeEntry[],
    subs: string[] | undefined,
  ) => {
    if (!subs) return;
    for (const sub of subs) {
      if (!someReasonIncludes(entries, sub)) {
        console.error(`FAIL ${f.id}: ${bucket} missing reason containing "${sub}" (${f.note})`);
        failed += 1;
      }
    }
  };

  checkIncludes("blocked", env.blockedOutcomes, ex.blockedTextIncludes);
  checkIncludes("costly", env.costlyOutcomes, ex.costlyTextIncludes);
  checkIncludes("unstable", env.unstableOutcomes, ex.unstableTextIncludes);
  checkIncludes("allowed", env.allowedOutcomes, ex.allowedTextIncludes);

  checkExcludes("blocked", env.blockedOutcomes, ex.blockedTextExcludes);
  checkExcludes("costly", env.costlyOutcomes, ex.costlyTextExcludes);
  checkExcludes("unstable", env.unstableOutcomes, ex.unstableTextExcludes);

  checkReasons("blocked", env.blockedOutcomes, ex.anyBlockedReasonIncludes);
  checkReasons("costly", env.costlyOutcomes, ex.anyCostlyReasonIncludes);
  checkReasons("unstable", env.unstableOutcomes, ex.anyUnstableReasonIncludes);
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK ${STAGE85_OUTCOME_ENVELOPE_FIXTURES.length} Stage 8.5 outcome-envelope fixtures`);
