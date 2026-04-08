/**
 * Fixed Source ids for Campti narrative DNA guide corpus (Phase 9F / 9F.1).
 * Upsert via scripts/seed-narrative-dna-guides.ts or admin workflows.
 */

export const SECTION_XIII_ENNEAGRAM_SOURCE_ID = "source-campti-section-xiii-enneagram-mapping";

export type GuideSourceDef = {
  id: string;
  title: string;
  /** Prefer NOTE until binary DOCX ingestion exists; use DOCX when file-backed. */
  sourceType: "NOTE" | "DOCX";
};

/** Full consolidation corpus: new sections + prior Phase 9F guides + genealogy/timeline. */
export const NARRATIVE_DNA_GUIDE_SOURCES: GuideSourceDef[] = [
  { id: "source-campti-section-i-overview", title: "Section I — Overview (Campti narrative bible)", sourceType: "NOTE" },
  { id: "source-campti-section-iv-thematic", title: "Section IV — Thematic Framework", sourceType: "NOTE" },
  { id: "source-narrative-system-subthemes", title: "Section IX — Subthemes, Motifs, and Literary Devices", sourceType: "NOTE" },
  { id: "source-historical-timeline-grappe-anchors", title: "Historical Timeline – Grappe Narrative Anchors", sourceType: "NOTE" },
  { id: "source-campti-section-v-narrative-structure", title: "Section V — Narrative Structure & Chapter Frameworks", sourceType: "NOTE" },
  { id: "source-campti-section-viii-themes-symbols", title: "Section VIII — Themes and Symbols", sourceType: "NOTE" },
  { id: "source-campti-section-xi-theological-symbolism", title: "Section XI — Theological and Spiritual Symbolism", sourceType: "NOTE" },
  { id: SECTION_XIII_ENNEAGRAM_SOURCE_ID, title: "Section XIII — Enneagram Mapping of Primary Characters", sourceType: "NOTE" },
  { id: "source-campti-section-xiv-symbolism-motifs", title: "Section XIV — Symbolism and Recurring Motifs", sourceType: "NOTE" },
  { id: "source-campti-section-xvi-literary-visual", title: "Section XVI — Literary and Visual Symbolism Guide", sourceType: "NOTE" },
];

export const NARRATIVE_DNA_GUIDE_SOURCE_IDS = NARRATIVE_DNA_GUIDE_SOURCES.map((s) => s.id);

export function isNarrativeDnaGuideSourceId(id: string): boolean {
  return NARRATIVE_DNA_GUIDE_SOURCE_IDS.includes(id);
}

export function isSectionXiiiInternalSourceId(id: string): boolean {
  return id === SECTION_XIII_ENNEAGRAM_SOURCE_ID;
}
