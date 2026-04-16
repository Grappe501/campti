# Book 1 Chapter Composition Pack

This pack demonstrates machine-usable chapter composition planning with multi-scene structure, delayed convergence, callback/reentry support, route recurrence, and philosophy propagation.

## Chapter Example A (Early Book 1)

- chapter: `book1-chapter-01`
- mode: `delayed_convergence`
- scenes: 4

```json
{
  "compositionPlanId": "book1-chapter-01:composition-plan",
  "chapterId": "book1-chapter-01",
  "compositionMode": "delayed_convergence",
  "sceneCountTarget": 4,
  "sceneRoles": ["grounding_scene", "relational_scene", "rumor_scene", "closure_scene"],
  "apparentlyDisconnectedSceneId": "book1-chapter-01-scene-03",
  "delayedConvergenceBindings": [
    {
      "delayedConvergenceKey": "book1-chapter-01:route-pressure-cluster",
      "convergenceWindow": "chapter+2..book+1",
      "connectionVisibilityNow": "apparently_isolated",
      "connectionVisibilityLater": "convergent_later"
    }
  ],
  "callbackMarkers": [
    {
      "callbackId": "book1-chapter-01:seed:3",
      "callbackType": "rumor_trade_contact",
      "callbackWindow": "chapter+2..book+1"
    }
  ],
  "reinterpretationAnchors": [
    {
      "reinterpretationAnchorId": "book1-chapter-01:book1-chapter-01-scene-03:reinterpret",
      "originalPovId": "natchitoches-matriarch-keeper",
      "alternatePovCandidates": ["younger-kin-observer"]
    }
  ],
  "settingRoutePresenceRequirement": {
    "requiredLocationIds": ["natchitoches", "alexandria-portage", "lower-river-market"],
    "missingLocationIds": ["alexandria-portage"]
  },
  "philosophyEchoPlacement": {
    "threadIds": ["book1-philosophy-reading-signs"],
    "mode": "action_pattern"
  },
  "density": {
    "densityScore": 0.72,
    "hardThinChapterFlag": false
  }
}
```

## Chapter Example B (Later Book 1)

- chapter: `book1-chapter-06`
- mode: `route_braided`
- scenes: 5

```json
{
  "compositionPlanId": "book1-chapter-06:composition-plan",
  "chapterId": "book1-chapter-06",
  "compositionMode": "route_braided",
  "sceneCountTarget": 5,
  "sceneRoles": ["setting_presence_scene", "warning_scene", "route_signal_scene", "convergence_scene", "closure_scene"],
  "delayedConvergenceBindings": [
    {
      "delayedConvergenceKey": "book1-chapter-06:warning-memory-cluster",
      "convergenceWindow": "chapter+1..chapter+3"
    }
  ],
  "callbackMarkers": [
    {
      "callbackId": "book1-chapter-06:seed:2",
      "callbackType": "warning_pattern"
    }
  ],
  "reinterpretationAnchors": [
    {
      "reinterpretationAnchorId": "book1-chapter-06:book1-chapter-06-scene-02:reinterpret",
      "likelyMeaningShift": "Warning read as private caution is reframed as route-network signal."
    }
  ],
  "chapterClosureProfile": "route_expansion",
  "carryForwardUnresolvedPressure": [
    "Trade corridor instability remains unresolved.",
    "Relational trust remains conditional."
  ]
}
```

## Notes

- Example A includes one scene that appears disconnected and converges later.
- Both examples include callback seed support and reinterpretation anchors.
- Both examples include route recurrence constraints and philosophy propagation routing.
