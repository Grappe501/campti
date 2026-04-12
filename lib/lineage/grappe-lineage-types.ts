/**
 * Grappe working lineage file — parallel id space (GRP-*) to seed `Person` ids.
 * `lineage_cluster` = pre-documentary or record-layer aggregate (not a provable individual).
 *
 * Do not treat reconstructed “native names” as historical fact without tribal / scholarly review.
 */
export type LineageEntityType = "person" | "lineage_cluster";

export type ConfidenceLevel = "high" | "medium" | "low" | "stub";

/** How the row entered the file — not proof of genealogy. */
export type EvidenceGrade = "compiled_gedcom_style" | "user_screenshot" | "hypothesis" | "primary_pending";

/** Louise / Besson / Alexis political household — simulation & novel anchors (still subject to parish proof). */
export type GrappeLineagePowerHousehold = {
  prior_spouse_display: string;
  prior_spouse_grp_id?: string;
  widowed_before_marriage_to_alexis: boolean;
  marriage_to_alexis_function: string;
  oral_history_rosette_freedom: string;
  matriarch_role: string;
};

/** Francois Sr. formative years — oral history + primary documents (may disagree; prefer primary_source_citation). */
export type GrappeLineageFormativeContext = {
  childhood_region: string;
  /** Rough anchor only; may be superseded by sworn testimony. */
  raised_in_region_until_age?: number;
  /** When primary text gives a range (e.g. "sixteen or seventeen"), use this instead of a single age. */
  raised_until_age_note?: string;
  identity_profile: string;
  /** Key quoted lines or summary from a deposition, memoir, etc. */
  primary_text_anchor?: string;
  /** e.g. John Sibley JP, date, repository. */
  primary_source_citation?: string;
  /** Article or digest that transcribes the primary source. */
  secondary_article_citation?: string;
};

export type GrappeLineagePerson = {
  id: string;
  full_name: string;
  display_name: string;
  birth_year: number | null;
  death_year: number | null;
  gender: "male" | "female" | "unknown";
  generation_index: number;
  parents: string[];
  spouses: string[];
  children: string[];
  lineage_branch: string;
  world_state_hint: string;
  confidence: ConfidenceLevel;
  source_basis: string;
  notes: string;
  entity_type: LineageEntityType;
  /** Optional: evidence tier for simulation / prompts (defaults interpreted in code if absent). */
  evidence_grade?: EvidenceGrade;
  /** Optional: regional / marriage politics (e.g. GRP-0002). */
  power_household?: GrappeLineagePowerHousehold;
  /** Optional: childhood & identity for story simulation (e.g. GRP-0040). */
  formative_context?: GrappeLineageFormativeContext;
};

/** Pelagie → Perot working branch (narrow scaffold for narrative / proof queue). */
export type GrappeLineagePelagiePerotScaffold = {
  /** Canonical id in this file (user draft used GRP-0201 for the same person). */
  anchor_marie_pelagie_id: string;
  user_scaffold_alt_ids: string[];
  spouse_id: string;
  perot_child_ids: string[];
  /** Rows where the line to Dorthlon / modern branch might attach — proof not selected. */
  hinge_candidate_ids?: string[];
  spelling_variants: string[];
  /** Labels from prior research — not proofed edges in this file. */
  downstream_working_path: string[];
  hinge_unresolved: string;
  /** Working reads when Manuel vs Marcelite split matters for Dortolon vs dit Perot. */
  hinge_path_notes?: {
    path_a_manuel_dit_perot?: string;
    path_b_marcelite_dortolon?: string;
  };
  /** When set, Perot–Grappe pivot child locked for direct-path narrative (parish proof may still refine). */
  emmanuel_lucas_anchor_id?: string;
};

/** Second-pass synthesis: hypotheses and anchors — still subject to parish proof. */
export type GrappeLineageTruthPass = {
  stable_working_anchor_ids: string[];
  jeanne_marie_anne_merge: string;
  louise_prior_marriage_besson: string;
  place_corridor: string;
  ignore_without_posterity: string;
  francois_sr_vs_jr: string;
  jacques_grappe_francois_rosatte_child: string;
  hinge_manuel_vs_marcelite: string;
  proof_queue: string[];
  /** Alexis–Louise union as trade/military/kinship strategy — working narrative. */
  alexis_marriage_alliance_note?: string;
  /** Single doc to build before expanding full Rosette line (lineage + fiction backbone). */
  backbone_doc_upper_river_power_household?: string;
  /** John Sibley JP deposition, 22 Sep 1805 — Francis Grappe of Campti (primary anchor for formative years). */
  francois_1805_sibley_deposition?: string;
  /** Screenshots + repeated tree structure: Rosette as enslaved/mixed-origin maternal anchor (Dupre, dit names) — still extract parish citations. */
  rosette_enslaved_maternal_anchor?: string;
  /** Emmanuel Lucas as Marie Pelagie 1766 + Perot child — not Pelagie b.1790 (chronology). */
  emmanuel_lucas_chronology_note?: string;
  /** Screenshot chain: Marie Jeanne → Francois (St. Denis) + Fanny; reconcile with Rosette (GRP-0041) in parish records. */
  st_denis_jeanne_fanny_line?: string;
  /** 1779 marriage/property contract — status document; cite repository + image. */
  marriage_contract_1779_note?: string;
  /** Alexis had multiple sons: François (GRP-0040) vs Jean B (GRP-0011) — where enslaved-line vs straight paternal chain attach. */
  alexis_jean_b_vs_francois_fork?: string;
};

/** Stabilization layer: what this dump is, how to use it, what to verify next. */
export type GrappeLineageInterpretation = {
  dataset_kind: string;
  authority_note: string;
  cultural_threads: string[];
  known_issues: string[];
  priority_research: string[];
  african_ancestry_notes?: string;
  truth_pass?: GrappeLineageTruthPass;
  pelagie_perot_scaffold?: GrappeLineagePelagiePerotScaffold;
};

/** Fiction / simulation layer — optional; never required for genealogy logic. */
export type GrappeLineageWorldBuildingDocumentKind =
  | "primary_transcript"
  | "secondary_article"
  | "user_notes"
  | "map"
  | "other";

/** One ingestible source for world-building (expand as you add documents). */
export type GrappeLineageWorldBuildingDocument = {
  id: string;
  title: string;
  author?: string;
  published_or_date?: string;
  kind: GrappeLineageWorldBuildingDocumentKind;
  related_grp_ids?: string[];
  extracted_facts: string[];
  /** Labeled guesses for fiction — not proven genealogy. */
  inferred: string[];
  /** Subtext, silences, irony, what the record dances around. */
  between_the_lines: string[];
  /** Scene seeds, sensory detail, character pressure. */
  fiction_hooks: string[];
};

/** Place / era bundle for atmosphere and cross-reference. */
export type GrappeLineageWorldBuildingPocket = {
  id: string;
  label: string;
  geography: string;
  era_notes: string[];
  mood_for_fiction?: string;
  related_grp_ids?: string[];
  related_document_ids?: string[];
};

/** Campti / Cane River as narrative stage (see `lib/lineage/grappe-world-building.v1.json`). */
export type GrappeWorldBuildingSetting = {
  primary_label: string;
  primary_pocket_ids?: string[];
  geography: string;
  story_function: string;
  tone_notes?: string[];
};

/** Ordered beats: entire Grappé line as characters against Campti setting. */
export type GrappeWorldBuildingSpineEntry = {
  order: number;
  grp_id: string;
  story_role: string;
  campti_connection: string;
};

/** Direct path vs parallel branches — for prompts; not proof. */
export type GrappeLineageBranchMap = {
  summary: string;
  A_founding_line: string[];
  B_rosette_generation: string[];
  /** Model B: Marie Jeanne + Francois (St Denis) + Fanny — screenshot subgraph; not merged into GRP-0042 edges until parish proof. */
  B2_jeanne_st_denis_screenshot_subgraph?: string[];
  C_direct_path_perot_hypothesis: string[];
  C_jacques_de_la_cerda_branch: string[];
  unresolved_or_noisy: string[];
  next_proof_targets: string[];
};

/** Standalone fiction layer file — not embedded in `grappe-lineage-working.v1.json`. */
export type GrappeLineageWorldBuilding = {
  version: string;
  /** Keep LLM and readers honest: this block is for story, not proof. */
  disclaimer: string;
  setting: GrappeWorldBuildingSetting;
  grappe_narrative_spine: GrappeWorldBuildingSpineEntry[];
  /** Optional: fork diagram as id lists (see also lineage interpretation). */
  branch_map?: GrappeLineageBranchMap;
  documents: GrappeLineageWorldBuildingDocument[];
  setting_pockets: GrappeLineageWorldBuildingPocket[];
  cross_cutting_themes: string[];
};

export type GrappeLineageFile = {
  tree_name: string;
  status: string;
  interpretation?: GrappeLineageInterpretation;
  people: GrappeLineagePerson[];
};
