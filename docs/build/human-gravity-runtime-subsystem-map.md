# Human-gravity runtime subsystem map (Cluster 6)

```mermaid
flowchart TB
  subgraph inputs [EEGS packs in canonical pre-generation]
    EEGS[CamptiEpicEmotionalGravityPack]
  end
  subgraph cluster6 [Cluster 6 derivation]
    ATT[AttachmentRuntimeBiasService]
    REL[RelationalStakesRuntimeBiasService]
    CON[ConsequencePersistenceRuntimeService]
    BUR[GenerationalBurdenRuntimeService]
    HG[HumanGravityRuntimeDerivationService]
  end
  subgraph canonical [Canonical scene path]
    SG[runSceneGeneration]
    PR[ProseRealismDerivationService]
    LLM[scene-generation-llm-adapter]
    HASH[canonical-scene-generation-hash]
    VAL[HumanGravityValidationService]
  end
  subgraph cockpit [Cockpit]
    COCK[AuthorCommandCockpitBundle.humanGravityRuntime]
  end
  EEGS --> HG
  ATT --> HG
  REL --> HG
  CON --> HG
  BUR --> HG
  SG --> HG
  HG --> PR
  HG --> LLM
  HG --> HASH
  SG --> VAL
  HG --> COCK
```

## File index

| Role | Path |
| --- | --- |
| Contract | `lib/domain/human-gravity-runtime.ts` |
| Derivation | `lib/services/human-gravity-runtime-derivation-service.ts` |
| Attachment | `lib/services/attachment-runtime-bias-service.ts` |
| Relational stakes | `lib/services/relational-stakes-runtime-bias-service.ts` |
| Consequence persistence | `lib/services/consequence-persistence-runtime-service.ts` |
| Generational burden | `lib/services/generational-burden-runtime-service.ts` |
| Validation | `lib/services/human-gravity-validation-service.ts` |
| Runtime-active truth labeling | `lib/services/human-gravity-runtime-influence-truth.ts` |
| Governance upstream (EEGS source) | `lib/services/canonical-narrative-governance-orchestration-service.ts` |
| Tests | `lib/services/human-gravity-cluster6.test.ts` |
