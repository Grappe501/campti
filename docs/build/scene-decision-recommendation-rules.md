# Scene Decision Recommendation — Rules (code-encoded)

Rules live in `collectSceneDecisionRecommendations` in `lib/services/scene-decision-assist-service.ts`. Priority rank (lower = earlier) is fixed in `CATEGORY_PRIORITY`.

## Priority order (intent)

1. **review_preflight_blockers** — `launchAllowance === blocked` or `overallReadinessClass === blocked` or non-empty blockers; environment/hash blockers called out in evidence when subsystem flags match.
2. **resolve_research_pressure_first** — blocking contradictions **or** (`contradictionShapedCount >= 2` && `openClaimsCount >= 2`).
3. **resolve_character_simulation_first** — rollup has blocked cast members **or** preflight `character_simulation` subsystem `isBlocker`.
4. **pause_relaunch_churn** — composite churn: `repairOrRevisionRunCount + floor(replayAttemptCount/2) >= 5` **or** repairs ≥3 with multiple risky allows.
5. **inspect_run_diff_first** — material structured diff on latest two ledger rows **and** (churn or failures) and preflight not blocked.
6. **repair_instead_of_replay** — repairs ≥2, replays ≥2, churn high (heuristic lean toward triage).
7. **replay_now** — allowance allowed/allowed_with_risk, low churn, no blocking research count, no sim blocking; strength reduced when recent failure pattern heuristics fire.
8. **proceed_stability_improving** — descriptive “cleaner window” signal; not a prose quality claim.
9. **historical_review_only** — legacy/partial run share high or explicit legacy codes.

## Post-processing

- `applySceneDecisionRecommendationSuppression` demotes conflicting `replay_now`, de-duplicates by category, sorts by priority and strength.

## Deferred

- Cross-scene or chapter-level prioritization.
- ML or LLM-generated prose coaching.
- Persisted “author dismissed recommendation” state.
