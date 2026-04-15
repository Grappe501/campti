# Chunk 7 - Moderation / Resilience / Degraded-State Tightening Inventory

## Scope and intent

This phase hardens operational failure handling for moderation, provider resilience, and degraded interaction flows without introducing new feature behavior, architecture redesign, or contract redesign.

## Task 1 - Risk surface inventory

### 1) `lib/services/reader-cockpit-command-service.ts`

- **Current behavior**
  - Resolves moderation outcomes, balance availability, cost-governance fallback, provider resilience fallback, and final debit decision in one orchestration path.
  - Debits units only when `degradedPolicy === null`.
- **Failure/degraded states supported**
  - Balance unavailable (`schema_missing`, `provider_failure`, `unknown_runtime_unavailable`), moderation `block/warn/degrade`, provider resilience fallback, cost-governance fallback.
- **Explicit vs ambiguous**
  - Ambiguous prior to this chunk: provider resilience fallback could remain `degradedPolicy === null`, causing debit despite fallback response.
  - Ambiguous prior to this chunk: moderation `shouldEndSession` could be returned but not enforced unless action was explicitly `end_session`.
  - Ambiguous prior to this chunk: moderation-driven fallback and provider-cost fallback were both recorded as `provider_failure`.
- **Accounting/debit correctness**
  - Core invariant existed (`shouldDebitInteractionUnitsForDegradedPolicy`) but fallback classification gaps could leak into debit path for resilience fallback.
- **Observability explicitness**
  - Prior degraded metadata lacked explicit fallback cause classification.
- **Moderation brittleness**
  - `shouldEndSession` signal depended on action routing consistency rather than a dedicated termination gate.

### 2) `lib/services/degraded-interaction-policy-service.ts`

- **Current behavior**
  - Maps unavailability reason + entitlement + environment to one degraded policy.
- **Failure/degraded states supported**
  - `schema_missing`, `provider_failure`, `unknown_runtime_unavailable`.
- **Explicit vs ambiguous**
  - Mapping logic is explicit, but test coverage previously focused on only two cases.
- **Accounting/debit correctness**
  - Indirect influence via policy; strong tests are required to prevent drift.
- **Observability explicitness**
  - Not directly observability-facing.
- **Moderation brittleness**
  - Not moderation-specific.

### 3) `lib/services/moderation-service.ts`

- **Current behavior**
  - Regex-based classification into `allow`, `warn`, `degrade`, `block`, `end_session`.
  - `block` can set `shouldEndSession`.
- **Failure/degraded states supported**
  - Blocking and degrade/warn routing.
- **Explicit vs ambiguous**
  - Prior system behavior risk existed at integration boundary: `shouldEndSession` not guaranteed to drive session termination.
- **Accounting/debit correctness**
  - Indirect; impacts whether turn reaches debit path.
- **Observability explicitness**
  - Reason strings are explicit and testable.
- **Moderation brittleness**
  - Heuristic regex approach remains intentionally simple and partial.

### 4) `lib/services/provider-resilience-service.ts`

- **Current behavior**
  - Retries operation and applies fallback after exhaustion; reports `usedFallback` and retry count.
- **Failure/degraded states supported**
  - Healthy, degraded, failed states with snapshot tracking.
- **Explicit vs ambiguous**
  - Service behavior itself is explicit; ambiguity was downstream interpretation in cockpit debit/degraded classification.
- **Accounting/debit correctness**
  - Indirect; costs depend on how callsite interprets fallback.
- **Observability explicitness**
  - Snapshot exposes state and reason.

### 5) `lib/services/degraded-interaction-observability-service.ts`

- **Current behavior**
  - Summarizes degraded metadata for cockpit/observability read models.
- **Failure/degraded states supported**
  - Policy + reason + free-turn + fallback-used.
- **Explicit vs ambiguous**
  - Prior metadata summary lacked explicit fallback-cause classification.
- **Accounting/debit correctness**
  - Indirect; aids operator trust.

### 6) Accounting/debit surfaces

- `lib/services/reader-interaction-balance-service.ts` provides atomic debit + ledger writes and already fails hard on unavailable balance.
- Primary risk for this phase was orchestration classification in cockpit before reaching debit calls.

## Task 2 - Highest-risk areas selected now

1. **Provider resilience fallback debit ambiguity in cockpit**
   - High risk for hidden unit leakage when fallback response is delivered.
2. **Moderation termination signal mismatch**
   - High trust risk if severe moderation outcome does not terminate session reliably.
3. **Degraded fallback-cause observability ambiguity**
   - High operator-risk due to conflation of provider failure with moderation/cost-governance fallback.
4. **Thin policy verification around degraded mapping**
   - Drift risk for policy behavior under environment/entitlement combinations.

## Tightening implemented in this chunk

### Degraded-state / accounting hardening

- In `reader-cockpit-command-service`, provider resilience fallback (`usedFallback`) now forces degraded handling for that turn (`allow_system_fallback_only` + `provider_failure`) before debit decision.
- Degraded free-turn cap check is centralized and enforced for any degraded path before response append/debit logic.
- Added explicit fallback-cause classification persisted into degraded metadata:
  - `balance_unavailable`
  - `provider_resilience`
  - `moderation`
  - `cost_governance`
- Moderation fallback and cost-governance fallback now map to `unknown_runtime_unavailable` instead of being mislabeled as provider failure.

### Moderation / resilience hardening

- Added explicit moderation termination gate helper used by cockpit (`shouldTerminateSessionFromModeration`) so `shouldEndSession` is enforced even when action is `block`.

### Observability clarity hardening

- `DegradedInteractionStateSummary` now includes `lastFallbackCause`.
- `summarizeDegradedInteractionState` reads and normalizes this field.

### Verification additions/strengthening

- Strengthened:
  - `degraded-interaction-policy-service.test.ts`
  - `moderation-service.test.ts`
  - `reader-cockpit-command-service.test.ts`
  - `degraded-interaction-observability-service.test.ts`
- Added strict full-system inclusion:
  - `verify:degraded-interaction-policy`
  - `verify:reader-cockpit-command`
  in `scripts/verify-full-system.ts`.

## Remaining weakness / intentional partials

- Moderation remains heuristic/regex based and can still produce false positives/false negatives by design.
- Provider resilience snapshot semantics (`failed` then `degraded` on fallback) remain intentionally simple and may be revisited for richer lifecycle semantics later.
- Cockpit orchestration still centralizes many policy decisions in one service; ownership is clearer via helper boundaries but not fully decomposed in this chunk.

## Duplicated/conflicting policy logic discovered

- No direct conflicting truth sources found.
- Mild duplication remains around degraded metadata shaping in cockpit writes and degraded summary reads; acceptable for this phase, but future consolidation could introduce a tiny shared degraded-state serializer/parser helper.

## Ownership notes

- **Cockpit orchestration** owns turn-time decision routing and economic gating.
- **Degraded policy service** owns reason-to-policy mapping.
- **Moderation service** owns text classification only.
- **Provider resilience service** owns retry/fallback mechanics only.
- **Degraded observability service** owns read-side projection of degraded metadata.

