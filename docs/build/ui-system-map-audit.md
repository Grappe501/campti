# UI System Map + Audit

Date: 2026-04-15  
Scope: Repo-wide discovery pass of UI systems, UX flow, and reader-facing delivery surfaces.  
Method: Static code inspection across routes/components/actions/services/contracts + requested command verification execution.

## Executive Summary

The platform already has a broad, high-quality reader delivery layer (`/read` hub, scene experience, chapter/character/place/timeline/symbol surfaces), but the interactive conversation UI is still product-provisional at the shell level despite mature backend orchestration.  
Author/debug capability is extensive in admin routes and service/action contracts, yet several critical inspection/continuity capabilities are backend-first and not wired to first-class reader/author surfaces.

Overall maturity is best described as **delivery-rich, interaction-capable, tooling-heavy, and partially productized**.

## Current UI/UX Maturity Assessment

- **Current phase (repo truth):** late foundational-to-early expansion, with strong reader delivery and partially productized interaction tooling.
- **Built strongly:** public reading delivery, immersive/guided/listen modes, continuity hooks, cockpit service stack, contract governance.
- **Built partially:** cockpit front-end productization, continuity unification, explicit degraded/moderation UX parity across reader surfaces.
- **Built but not surfaced:** story reentry continuity action, authorial inspection action, conversation observer action.
- **Missing/weak:** single authoritative continuity source in UX, unified ownership for debug/inspection surfaces.

## Reader-Facing Surface Inventory

### Primary reading and navigation surfaces

- `app/read/layout.tsx` + `components/read/read-cockpit-frame.tsx`: global read shell and nav frame.
- `app/read/page.tsx`: read hub with server return card (`getPublicReturnExperience`) and local fallback (`ContinueReadingBanner`).
- `app/read/scenes/[id]/page.tsx` + `components/public/read-scene-experience.tsx`: core scene delivery surface with mode controls, audio, linked threads, progression links, and side-panel interactions.
- `app/read/chapters/page.tsx` and `app/read/chapters/[id]/page.tsx`: chapter browsing and chapter-to-scene progression.
- `app/read/characters/page.tsx` and `app/read/characters/[id]/page.tsx`: cast browse/detail + local follow affordance.
- `app/read/places/page.tsx` and `app/read/places/[id]/page.tsx`: place browse/detail with scene and symbolic context.
- `app/read/timeline/page.tsx`: historical timeline orientation.
- `app/read/symbols/page.tsx`: symbol index plus session-thread suggestion overlays.

### Reader interaction and control surfaces

- `app/read/cockpit/page.tsx` + `components/read/reader-cockpit-shell.tsx`: start/pause/resume/end and turn submission flow.
- `components/read/reader-options-bar.tsx`: display and reading preference controls.
- `components/read/hands-free-panel.tsx`: voice/gaze-like interaction controls for navigation and display changes.
- `components/public/public-audio-player.tsx`: narration/ambient playback and listen telemetry hooks.
- `components/public/immersive-error-boundary.tsx`: immersive fallback behavior.

### Personalization and depth framing

- `app/membership/page.tsx`: depth/membership framing content (static, future-facing).
- `app/subscribe/page.tsx`: redirect-only route to membership.

## Author / Debug / Internal Surface Inventory

- `app/admin/layout.tsx` + `components/admin-nav.tsx`: canonical admin shell.
- `components/admin-page-agent-panel.tsx` + `/api/admin/agent/chat`: page-specialist explainability panel for admin pages.
- Observer/debug pages:
  - `app/admin/world-observer/page.tsx`
  - `app/admin/scenes/[id]/observer/page.tsx`
  - `app/admin/characters/[id]/observer/page.tsx`
  - `app/admin/simulations/[id]/page.tsx`
- Narrative authoring/inspection pages:
  - `app/admin/narrative/page.tsx`
  - `app/admin/narrative/books/[bookId]/page.tsx`
  - `app/admin/narrative/chapters/[chapterId]/assembly/page.tsx`
- Workspace debug surface:
  - `app/admin/scenes/[id]/workspace/page.tsx`

### Internal action/service surfaces without direct UI consumer

- `app/actions/author-inspection.ts` -> `lib/services/authorial-inspection-service.ts`
- `app/actions/conversation-observer.ts` -> `lib/services/conversation-observer-service.ts`
- `app/actions/story-reentry.ts` -> `lib/services/story-reentry-continuity-service.ts`

## Critical UI Wiring Map

Primary chains are documented in `reports/ui-wiring-map.json`. Key high-value chains:

1. **Scene UX continuity writeback**  
   `read-scene-experience` -> `syncReaderStateFromClient` -> `prisma.readerState`.

2. **Scene audio telemetry**  
   `public-audio-player` -> `recordVoiceListenSeconds` -> `prisma.readerVoiceListen`.

3. **Cockpit turn lifecycle**  
   `reader-cockpit-shell` -> `app/actions/reader-cockpit.ts` -> `reader-cockpit-command-service.ts` -> contract validation (`conversationalTurnInput`, `characterResponse`, `readerCockpitPayload`) -> session/turn/balance persistence.

4. **Cockpit aggregate read-model**  
   `reader-cockpit-command-service.ts` -> `buildReaderCockpitPayload` (`reader-cockpit-payload-service.ts`) -> multi-service orchestration + registry validation.

5. **Admin explainability chat**  
   `admin-page-agent-panel` -> `/api/admin/agent/chat` -> admin page agent definitions and auth gate.

## Session / Interaction UX Map

### Implemented flows

- **Start / pause / resume / end:** fully implemented in cockpit action/service stack.
- **Reader-character turn exchange:** implemented with moderation, degraded policy, resilience fallback, entitlement/balance gating.
- **Session memory linkage:** implemented in service layer via memory summary writes and reader state updates.
- **Presentation preference toggle:** implemented (translated default vs native when available).

### Degraded, moderation, and fallback UX status

- **Cockpit UI:** explicit degraded read-only/limited-mode labels are present.
- **Public scene UI:** no equivalent explicit moderation/degraded state affordance surfaced at the same depth.
- **Fallback implementation:** strong in service layer; user-facing representation varies by surface.

## Delivery / Book / Chapter Experience Map

- **Chapter loading/presentation:** implemented via public chapter index/detail routes.
- **Scene progression:** implemented via scene navigation and continuation links in `read-scene-experience`.
- **Chapter transition handling:** explicit next-chapter links in scene navigation.
- **Book progression handling:** partial in reader surfaces; stronger in admin narrative/book/chapter assembly pages.
- **Branch/reconvergence UX:** backend governance exists, but direct reader-facing branch UX is not first-class.
- **Production/manuscript surfaces:** available in admin and verification scripts, not exposed as reader product UI.

## Personalization / Mode Control Map

- **Mode controls:** read/feel/guided/listen implemented in scene experience.
- **Voice/text mode switching:** implemented in scene and cockpit contexts.
- **Explanation density / depth reveal:** depth section and premium gates exist; largely framing-based.
- **Interactive vs passive paths:** both exist (public passive reading vs cockpit interaction).
- **Preferences storage/use:** localStorage-driven for many reader prefs; server state exists for continuation essentials.
- **Entitlement-driven differences:** enforced strongly in services; only partially surfaced in reader-facing visuals.

## State / Contract Dependency Map

Central UI correctness dependencies:

- `lib/public-data.ts` (public read models and return experience).
- `app/actions/reader-memory.ts` (reader continuity + imprint/audio writebacks).
- `lib/services/reader-cockpit-command-service.ts` (interaction orchestration).
- `lib/services/reader-cockpit-payload-service.ts` (cockpit aggregate builder).
- `lib/contracts/contract-registry.ts` (contract versioning and runtime validation).
- `lib/services/interaction-truth-firewall-service.ts` (truth-plane write boundary).

Core contracts/payloads:

- `readerCockpitPayload`
- `conversationalTurnInput`
- `characterResponse`
- `authorInspectionPayload`
- `conversationObservabilitySnapshot`
- world/chapter/book observer snapshot contracts

## Duplication / Drift Findings

1. **Continuity source duplication (explicit):**  
   Reader continuation is represented in both localStorage and server `readerState`; these can temporarily diverge.

2. **Observer access path duplication (explicit):**  
   Observer capabilities are surfaced both via admin pages and action-based APIs without one declared UI ownership plane.

3. **Route discoverability drift (explicit):**  
   `components/admin-nav.tsx` link inventory does not fully represent all available admin surfaces (for example narrative hub and observer/simulation routes).

4. **Contract strictness drift risk (explicit):**  
   `readerCockpitPayload` schema uses permissive `z.unknown()` for several nested fields, weakening runtime shape enforcement relative to TypeScript definitions.

## Weak / Provisional Surfaces

- Reader cockpit shell (`readerId`/`characterId`/`sceneId` manual entry) is operational but product-provisional.
- Action-only capabilities with no direct page consumer:
  - author inspection
  - conversation observability snapshot
  - story reentry continuity
- Some depth/membership messaging is intentionally ahead of fully surfaced product enforcement.

## Ownership Map

See `reports/ui-ownership-scorecard.json` for subsystem scoring.

High clarity:

- Public read-model assembly ownership (`lib/public-data.ts` + read routes).
- Cockpit orchestration ownership (`reader-cockpit-command-service.ts` and payload service).

Lower clarity:

- Unwired inspection/reentry action surfaces.
- Admin route discoverability/ownership boundaries.

## Verification Coverage Map

Command execution evidence:

- `npm run typecheck` -> pass
- `npm run build` -> pass
- `npm run verify:reader-cockpit-payload` -> pass
- `npm run verify:reader-cockpit-command` -> pass
- `npm run verify:full-system:strict` -> pass

Additional evidence from strict run includes contracts, interaction truth firewall, storyline stack, prelaunch, production-layer, moderation, degraded-policy, and story-reentry tests.

Coverage quality by area:

- **Strongly verified:** cockpit services, contract governance, truth-firewall, moderation/degraded policy, story reentry service logic.
- **Weakly verified:** page-level/public UI rendering behavior (comparatively less dedicated UI test coverage observed).
- **Unverified from UI perspective:** direct route consumers for action-only inspection/reentry APIs.

## Explicit Audit Question Answers

1. **What reader-facing experience already exists today?**  
   A full public reading stack exists: read hub, chapters, scenes, characters, places, timeline, symbols, multi-mode scene rendering, audio playback, continuity affordances, and membership/depth framing.

2. **What author/debug/internal experience already exists today?**  
   Extensive admin pages, observer/debug pages, admin specialist panel, and narrative assembly views exist; several inspection capabilities exist as action/service APIs only.

3. **What interaction/session flows are actually implemented?**  
   Start/pause/resume/end and turn submit/fetch flows are implemented in cockpit; moderation, degraded-state policy, entitlement gating, and resilience fallbacks are operational in backend service chains.

4. **What delivery/book/chapter experience is implemented vs implied?**  
   Chapter/scene delivery is implemented strongly for readers; deeper book/program governance and production-layer capabilities are mostly admin/backend surfaced rather than reader productized.

5. **What personalization/mode/session continuity surfaces already exist?**  
   Scene mode controls, reader UI preferences, rhythm/scroll persistence, return experience cards, and cockpit presentation preference exist; continuity is split across local and server state.

6. **What UI systems are duplicated, weakly owned, or drifting?**  
   Continuity state is duplicated (local vs server), observer access is split (page vs action), admin route discoverability drifts from actual route inventory, and action-only inspection features lack clear UI owner.

7. **What contracts/payloads are central to UI correctness?**  
   `readerCockpitPayload`, `conversationalTurnInput`, `characterResponse`, `authorInspectionPayload`, `conversationObservabilitySnapshot`, and observer snapshot contracts.

8. **Which parts are strongly verified vs weakly verified vs unverified?**  
   Strong: cockpit/contract/truth-boundary service stack.  
   Weak: page-level rendering and UX assertions for public routes.  
   Unverified as UI: action-only inspection/reentry surfaces without route consumers.

9. **What phase of UI/reader-experience maturity is the platform in now?**  
   Delivery-rich and interaction-capable, but not fully productized for all implemented backend capabilities (especially author/debug and reentry continuity surfaces).

## Top Blockers / Risks for Next UI-Focused Phase

- No single authoritative continuity source in user-facing UX.
- Story reentry continuity is implemented but not surfaced.
- Author/debug inspection APIs lack clear UI ownership and discovery.
- Cockpit runtime schema strictness is uneven in nested payload fields.
- Admin discoverability gaps can hide existing internal surfaces.

## Recommended Immediate Next UI Hardening / Design Priorities

1. Choose and enforce one continuity truth path for reader return/resume UX.
2. Wire story-reentry continuity into a concrete reader reentry surface.
3. Define clear ownership and UI entrypoints for author inspection and conversation observer capabilities.
4. Tighten `readerCockpitPayload` nested runtime schema validation where practical.
5. Add focused route-level UI verification for high-traffic reader surfaces (`/read`, `/read/scenes/[id]`, `/read/cockpit`).

