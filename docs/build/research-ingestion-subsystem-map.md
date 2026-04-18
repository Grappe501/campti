# RICRE subsystem map

```mermaid
flowchart LR
  subgraph ingest [Ingestion]
    T[AuthorResearchTarget]
    S[AuthorResearchSource]
    T --> S
  end
  subgraph extract [Extraction]
    E[AuthorResearchEvidence]
    C[AuthorResearchClaim]
    S --> E --> C
  end
  subgraph compare [Canon compare]
    CC[AuthorCanonComparison]
    C --> CC
    CK[AuthorCanonKnowledgeRecord]
    P[Person.description]
    PL[Place.description]
    CC --> CK
    CC --> P
    CC --> PL
  end
  subgraph decide [Author decision]
    D[AuthorCanonDecision]
    R[CanonReconciliationService]
    C --> R --> D
    R --> CK
  end
  subgraph runtime [Canonical runtime]
    L[loadSceneGenerationInput]
    AD[LLM adapter RICRE_ACCEPTED_CANON]
    CK --> L --> AD
  end
```

## Key boundaries

- **P2-E** narrative sources remain the temporal truth firewall for cited historical text.
- **RICRE** accepted canon is **additional author-gated grounding**, hashed and labeled separately.
- **Cockpit** surfaces queue health; mutations go through services / future admin actions—not the bundle.
