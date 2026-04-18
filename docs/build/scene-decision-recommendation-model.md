# Scene Decision Recommendation — Domain Model

## Core types (`lib/domain/scene-decision-assist.ts`)

| Type | Role |
|------|------|
| `SceneDecisionAssistViewModel` | Full payload for tab UI and server actions |
| `SceneDecisionRecommendationSet` | `primary` + `secondary[]` after ranking and de-duplication |
| `SceneDecisionRecommendation` | One advisory item: category, strength, basis, actions, notes |
| `SceneDecisionRecommendationBasis` | Summary + factual evidence + heuristic notes + triggers |
| `SceneDecisionRecommendationEvidenceSummary` | `text` + `kind`: `fact` \| `heuristic` \| `unavailable` \| `partial` |
| `SceneDecisionRecommendationAction` | `scene_tab` \| `href` \| `advisory_only` with label and explanation |
| `SceneDecisionRecommendationStrength` | `strong` \| `moderate` \| `light` \| `informational` |
| `SceneDecisionRecommendationCategory` | Bounded taxonomy (replay, repair, research, sim, preflight, diff, churn, proceed, historical) |
| `SceneDecisionAssistSuppressionReason` | Why a recommendation was demoted or de-prioritized |
| `SceneDecisionAssistCockpitCard` | Slim summary for narrative cockpit |

## Validation

`SceneDecisionAssistRequestSchema` — `sceneId`, optional `ledgerRunKey`, optional `maxLedgerEntries`.

## Server action

`loadSceneDecisionAssistAction` — validates input, calls `buildSceneDecisionAssistViewModel`.

## Run focus

When `ledgerRunKey` is present, `runFocus` echoes replay eligibility and notes from the ledger row **if** it appears in the loaded window; otherwise an honest partial note is emitted.
