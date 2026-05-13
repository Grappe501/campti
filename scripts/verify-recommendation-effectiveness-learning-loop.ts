/**
 * Recommendation effectiveness / learning loop — static verification.
 * Run: npx tsx scripts/verify-recommendation-effectiveness-learning-loop.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import assert from "node:assert/strict";

import { computeCategoryCorrelationsFromEvents } from "@/lib/services/scene-recommendation-effectiveness-service";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf-8");
}

async function main() {
  const schema = read("prisma/schema.prisma");
  assert.ok(schema.includes("model SceneRecommendationEvent"), "Prisma SceneRecommendationEvent model");

  const log = read("lib/services/scene-recommendation-learning-log-service.ts");
  assert.ok(log.includes("logRecommendationShownFromAssistInput"), "shown logging");
  assert.ok(log.includes("recommendation_shown"), "shown event type");

  const outcome = read("lib/services/scene-recommendation-outcome-linking-service.ts");
  assert.ok(outcome.includes("recordLaunchOutcomeForRecommendationLearning"), "outcome linker");

  const eff = read("lib/services/scene-recommendation-effectiveness-service.ts");
  assert.ok(eff.includes("buildSceneRecommendationEffectivenessViewModel"), "effectiveness VM");
  assert.ok(eff.includes("applyEffectivenessToRecommendationSet"), "assist integration hook");

  const assist = read("lib/services/scene-decision-assist-service.ts");
  assert.ok(assist.includes("logRecommendationShownFromAssistInput"), "assist logs shown");
  assert.ok(assist.includes("applyEffectivenessToRecommendationSet"), "assist applies learning");

  const domain = read("lib/domain/scene-recommendation-learning.ts");
  assert.ok(domain.includes("insufficient_history"), "honest history status");

  const action = read("app/actions/scene-recommendation-learning.ts");
  assert.ok(action.includes("logRecommendationFollowupAction"), "follow-up server action");

  const ui = read("components/admin/scene-decision-assist-client.tsx");
  assert.ok(ui.includes("effectivenessSummary"), "UI surfaces effectiveness");
  assert.ok(ui.includes("RecommendationEffectivenessAnalyticsPanel"), "operator effectiveness analytics panel");
  assert.ok(ui.includes("logRecommendationFollowupAction"), "UI instruments follow-up");

  const corr = computeCategoryCorrelationsFromEvents([]);
  assert.ok(Array.isArray(corr));
  assert.ok(corr.length >= 9);

  console.log("[verify-recommendation-effectiveness-learning-loop] OK");
  console.log("Run: npm run verify:recommendation-effectiveness-learning-loop");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
