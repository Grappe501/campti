/**
 * Packet 04 — Compare Asha-focal vs Elaya-focal on the riverbank scene (same world slice).
 * Run after `npx prisma db seed` with DB containing Red River seed.
 *
 * Usage: npx tsx scripts/verify-red-river-focal-alternation.ts
 */
import { assembleSceneConstraintSet, getFocalTimeBrainForScene } from "@/lib/scene-constraint-engine";
import { getCharacterBrainBundle } from "@/lib/character-brain-bundle";

const SCENE_ID = "ing-rr-scene-riverbank-disclosure";
const WS09 = "seed-ws-ref-ws09";
const ASHA = "seed-person-asha";
const ELAYA = "seed-person-elaya";

function headline(s: string) {
  console.log(`\n=== ${s} ===\n`);
}

async function dumpFocal(focal: string) {
  headline(`Focal: ${focal}`);
  const set = await assembleSceneConstraintSet(SCENE_ID, WS09, focal);
  if (!set) {
    console.log("No constraint set — scene or DB missing?");
    return;
  }
  const bundle = await getCharacterBrainBundle(focal, WS09, SCENE_ID, null);
  const deep = await getFocalTimeBrainForScene(SCENE_ID, WS09, focal);

  console.log("--- Counterpart / relational (bundle) ---");
  console.log(
    JSON.stringify(
      {
        resolutionSource: bundle.counterpartContext?.resolutionSource,
        counterpartId: bundle.counterpartContext?.counterpartPersonId,
        displayName: bundle.counterpartContext?.displayName,
        dyad: bundle.counterpartContext?.dyad,
        safePeople: bundle.relationships?.safePeople,
        unsafePeople: bundle.relationships?.unsafePeople,
      },
      null,
      2,
    ),
  );

  if (deep) {
    const { brain, evaluation } = deep;
    console.log("\n--- Stage 7 brain (envelopes) ---");
    console.log(
      JSON.stringify(
        {
          perception: brain.perception,
          regulation: brain.regulation,
          relationalSafety: brain.relationalSafety,
          decision: {
            speechBandwidth: brain.decision.speechBandwidth,
            defianceCost: brain.decision.defianceCost,
            mostLikelyMove: brain.decision.mostLikelyMove,
            availableActions: brain.decision.availableActions.slice(0, 6),
            forbiddenActions: brain.decision.forbiddenActions.slice(0, 4),
          },
        },
        null,
        2,
      ),
    );

    console.log("\n--- Stage 7.5 scene-time runner ---");
    console.log(
      JSON.stringify(
        {
          counterpartSummary: evaluation.counterpartSummary,
          salientSignals: evaluation.salientSignals,
          dominantInterpretation: evaluation.dominantInterpretation,
          regulationMode: evaluation.regulationMode,
          speechWindow: evaluation.speechWindow,
          actionWindow: evaluation.actionWindow,
          mostLikelyMove: evaluation.mostLikelyMove,
          primaryFear: evaluation.primaryFear,
          runnerTrace: evaluation.runnerTrace.map((t) => ({ label: t.label, summary: t.summary })),
        },
        null,
        2,
      ),
    );
  }

  console.log("\n--- Stage 8 snapshot (subset) ---");
  console.log("sceneReadinessClass:", set.sceneReadinessClass, "/", set.sceneReadinessClassSource);
  console.log("pressure.items (first 4):", set.pressure.items.slice(0, 4).map((i) => i.label));
  console.log("focalBrainHints:", set.pressure.focalBrainHints.slice(0, 5));
  console.log("perception.focalDominantInterpretation:", set.perception.focalDominantInterpretation?.slice(0, 200));

  console.log("\n--- Objectives ---");
  console.log(JSON.stringify(set.objectives.focal, null, 2));

  console.log("\n--- Stage 8.5 outcome envelope (counts + first lines) ---");
  const env = set.outcomeEnvelope;
  console.log({
    blocked: env.blockedOutcomes.length,
    costly: env.costlyOutcomes.length,
    allowed: env.allowedOutcomes.length,
    unstable: env.unstableOutcomes.length,
  });
  console.log("blocked[0]:", env.blockedOutcomes[0]?.text);
  console.log("costly[0]:", env.costlyOutcomes[0]?.text, "| reason:", env.costlyOutcomes[0]?.reason);
  console.log("unstable[0]:", env.unstableOutcomes[0]?.text, "| reason:", env.unstableOutcomes[0]?.reason);
}

async function main() {
  await dumpFocal(ASHA);
  await dumpFocal(ELAYA);
  headline("Packet 04 note");
  console.log(
    "Scene JSON counterpartPersonId=Elaya: skipped when Elaya is focal (equals focal id) → counterpart resolves via in-scene dyad to Asha.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
