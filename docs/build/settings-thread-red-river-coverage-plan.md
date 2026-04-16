# Settings Thread Red River Coverage Plan

## Goal

Maintain persistent location recurrence across each book by treating place as a narrative thread carrier, not passive backdrop.

## Coverage Model

Implemented by `SettingThreadCoverageService`.

Inputs:

- required location ids on route
- location presence seeds (direct and indirect appearance modes)
- setting/route/place-attachment threads

Outputs:

- `red_river_setting_coverage_report`
- `records` by location (appearance counts, direct vs indirect counts, associated threads/characters)
- missing and underrepresented location diagnostics
- recurrence recommendations

## Accepted Appearance Modes

- direct scene
- report
- rumor
- messenger/trader arrival
- remembered place
- heard event
- expected danger
- route mention
- trade origin/destination reference
- kin tie
- ceremonial tie
- resource tie

## Narrative Function of Setting

Location records support meaning roles:

- warning carrier
- memory carrier
- trade-network connector
- kinship connector
- identity anchor
- emotional residue or promise carrier
- philosophy/worldview carrier

## Current Book 1 Baseline

Required route locations used in code:

- `natchitoches`
- `alexandria-portage`
- `atchafalaya-fork`
- `lower-river-market`

Indirect mentions count toward recurrence and are surfaced in cockpit warnings/recommendations.
