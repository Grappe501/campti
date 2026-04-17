# Prose Realism Subsystem Map (Cluster 5)

```mermaid
flowchart TD
  subgraph canonical["Canonical scene path"]
    A[runSceneGeneration] --> B[loadSceneGenerationInput]
    B --> C[prepareCanonicalPreGenerationBundle optional Cluster 4]
    C --> D[ProseRealismDerivationService]
    D --> E[SceneGenerationInput.proseRealismLayer]
    E --> F[computeSceneGenerationInputHash]
    F --> G[generateSceneProseWithModel]
    G --> H[ProseRealismValidationService]
    H --> I[SceneGenerationRunResult.proseRealism]
  end

  subgraph helpers["Deterministic helpers"]
    D --> V[SceneVoiceDifferentiationService]
    D --> Er[EraCognitionRealismService]
    D --> N[narrator pack lines]
    D --> Em[EmotionalResidueProseService]
    D --> L[LiteraryNaturalizationService]
  end

  subgraph cockpit["Author cockpit"]
    J[buildProseRealismCockpitPanelFromGovernance] --> K[AuthorCommandCockpitBundle.proseRealism]
  end
```

## Enforcement

- Subsystem id: `prose_narrative_realism_cluster5` (`enforcement-registry-service.ts`)
- Cockpit panel key: `proseRealism` (`enforcement-cockpit-truth-service.ts`)
