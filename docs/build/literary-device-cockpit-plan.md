# Literary Device Cockpit Plan

## Authoritative Surface

LDCS UI is integrated into `Author Command Cockpit` as a dedicated **Literary Devices** section.

## Panels Implemented

- Active device panel
  - per device: activation mode, density band, scope, contexts, misuse risk, chapter status
- Alliteration control
  - numeric input -> semantic density mapping (`rare|occasional|patterned|motif_driven`)
  - allowed/forbidden line zones
  - consonant clustering tolerance
- Symbol registry editor view
  - symbols, carriers, thread bindings, setting bindings, payoff/callback windows
- Motif registry view
- Route echo controls
- Philosophy echo controls
- Density warnings, misuse warnings, drift warnings
- Chapter literary profile summary
- Per-scene device distribution summary

## Validation Visibility

Cockpit receives LD validation diagnostics and does not bypass guardrails:

- hard failures remain blocking diagnostics
- soft warnings remain advisory
- suppression recommendations exposed to author

## Data Path

- `LiteraryDeviceCockpitService.buildSummary` -> `buildAuthorCommandCockpitBundle(... literaryDevices ...)` -> `AuthorCommandCockpit` component rendering
