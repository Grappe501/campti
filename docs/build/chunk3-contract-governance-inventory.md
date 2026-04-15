# CHUNK 3 Contract Governance Inventory

This document records the in-scope versioned payload inventory and governance hardening completed for CHUNK 3.

## Scope

- Goal: complete registry governance for high-risk versioned payload families carrying `contractVersion`.
- In scope: payloads crossing service, persistence, and action boundaries for cockpit, author inspection, and observability surfaces.
- Out of scope: architecture redesign, read-model consolidation, truth-boundary expansion, and product feature work.

## Inventory Summary

| Payload family | Definition | Produced by | Consumed by | Governance before | Governance after | Validation boundary clarity |
|---|---|---|---|---|---|---|
| `readerCockpitPayload` | `lib/domain/reader-cockpit-payload.ts` | `lib/services/reader-cockpit-payload-service.ts` (`buildReaderCockpitPayload`) | `app/actions/reader-cockpit.ts`, `lib/services/reader-cockpit-command-service.ts`, `lib/services/story-reentry-continuity-service.ts` | Had `contractVersion` but no registry definition or schema; payload assembly returned unvalidated objects | Registered in `lib/contracts/contract-registry.ts` with `readerCockpitPayloadSchemaV1`; service now validates payload on write at return points (including cache reads) | Write-time validation is explicit in payload service; failure is developer/operator-facing (throws in server path) |
| `authorInspectionPayload` | `lib/domain/author-inspection-payload.ts` | `lib/services/authorial-inspection-service.ts` (`runAuthorialInspection`) | `app/actions/author-inspection.ts` | Had `contractVersion` field but no registry-backed schema governance | Registered with `authorInspectionPayloadSchemaV1`; service now validates write payload in all return paths | Write validation now centralized and explicit in service; failure is developer/operator-facing |
| `conversationObservabilitySnapshot` | `lib/domain/conversation-observability.ts` | `lib/services/conversation-observer-service.ts` (`composeConversationObservabilitySnapshot`) | `app/actions/conversation-observer.ts` | Versioned surface with weak/no centralized contract enforcement | Registered with `conversationObservabilitySnapshotSchemaV1`; service validates before emit | Write boundary now explicit at service emit; failure is developer/operator-facing |
| `interactionObservabilitySummary` | `lib/domain/interaction-observability-summary.ts` | `lib/services/narrative-interaction-observability-bridge.ts` (`buildInteractionObservabilitySummary`) | Observability bridge/dashboard callers | Version literal existed in producer output but not registered or typed as dedicated contract family | Added dedicated domain contract file, registered with `interactionObservabilitySummarySchemaV1`, write-time validation at builder boundary | Write validation explicit at bridge emit; failure is developer/operator-facing |

## Schema Tightening Outcome (High-Risk Surfaces)

- `readerCockpitPayload`: top-level object and key nested aggregates now use explicit `z.object(...).strict()` where fields are stable/high-risk for drift.
- `authorInspectionPayload`: explicit strict schema for all major top-level and nested structures used by admin inspection output.
- `conversationObservabilitySnapshot`: strict schema for session, identity, guardrail, drift, and turn observability line items.
- `interactionObservabilitySummary`: strict complete schema across all fields including `nonCanonical: true`.

## Residual Weak Points (Intentional Deferrals)

- `readerCockpitPayload` still has permissive fields (`z.unknown()`) for selected nested sections (`policySummary`, `sessionMemorySummary`, `degradedInteraction`, and some optional product aggregates) to avoid fragile churn in this bounded phase.
- `conversationObservabilitySnapshot` keeps `policySummary`, `emotionalContinuity`, and `degradedInteraction` as `z.unknown()` because those structures are broad and shared; tightening them fully is deferred to a dedicated cross-surface contract normalization phase.
- Contract validation is currently write-heavy for these families; no additional read-path validation was added in this chunk to avoid broad runtime behavior changes.

## Validation Responsibility Matrix

| Payload family | Validation type | Validation location | Primary failure audience | Governance completeness |
|---|---|---|---|---|
| `readerCockpitPayload` | Write | `buildReaderCockpitPayload` service emit/cached-return boundaries | Developer/operator | Partial-strict (high-risk enforced, selected nested fields deferred) |
| `authorInspectionPayload` | Write | `runAuthorialInspection` service return boundaries | Developer/operator | Strict for current payload surface |
| `conversationObservabilitySnapshot` | Write | `composeConversationObservabilitySnapshot` emit boundary | Developer/operator | Partial-strict (selected nested unknowns deferred) |
| `interactionObservabilitySummary` | Write | `buildInteractionObservabilitySummary` emit boundary | Developer/operator | Strict for current payload surface |

## Duplicated Validation Logic / Conflicting Truth Sources

- No conflicting contract truth source was found for these payload families after registry registration; `lib/contracts/contract-registry.ts` is now the central schema/version source.
- Some producer services still contain local shape-assembly logic before calling `validateRegisteredContractPayload`. This is expected and not a truth conflict.
- Small future consolidation opportunity: add helper wrappers for repeated `validateRegisteredContractPayload(contractName, payload, "write")` emission patterns if duplication grows, but defer for now to keep this chunk bounded.
