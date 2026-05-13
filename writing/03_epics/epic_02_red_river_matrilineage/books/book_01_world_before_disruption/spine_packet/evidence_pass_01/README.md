# Evidence pass 01 — Book 01 spine

**Canon status:** PROPOSED (pass metadata)

## Purpose

Inspect existing repo material and **summarize** into extraction files **before** editing the main spine prompts in the parent `spine_packet/` folder.

## Rules

- **No** long verbatim copies from `docs/book1/` or other sources — paths + short summaries only.
- Default label: **PROPOSED**. Use **CONFIRMED** only when pointing at an explicit row in `writing/01_canon/` (currently sparse).
- Disagreements between sources → `contradictions_or_tensions.md` (do not resolve silently).

## Files

| File | Role |
|------|------|
| `source_inventory.md` | Every inspected source row |
| `extracted_*.md` | Atomic extractions with `Source ID` |
| `contradictions_or_tensions.md` | Documented tensions |
| `missing_material.md` | Gaps, unindexed chunks, human needs |

## Next

After review, sync upward: `../spine_synthesis_v1.md`, `../chapter_manifest_v0.md`, `writing/04_production_dashboard/book_status.md`.
