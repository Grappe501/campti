import {
  OntologyFamily,
  RecordType,
  RegistryFamily,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

const RT = RecordType.HYBRID;
const VIS = VisibilityStatus.REVIEW;

const ONTOLOGY_ROWS: {
  key: string;
  name: string;
  description: string;
  family: OntologyFamily;
}[] = [
  { key: "person", name: "Person", description: "Individual human or named character in the model.", family: OntologyFamily.ENTITY },
  { key: "collective", name: "Collective", description: "Named group, family line, or community abstraction.", family: OntologyFamily.ENTITY },
  { key: "place", name: "Place", description: "Geographic or social location (town, home, church, field).", family: OntologyFamily.ENTITY },
  {
    key: "environment_zone",
    name: "Environment zone",
    description: "Sub-place or zoned environment (threshold, corridor, ritual space).",
    family: OntologyFamily.ENVIRONMENT,
  },
  { key: "event", name: "Event", description: "Historical or story event node.", family: OntologyFamily.ENTITY },
  { key: "ritual", name: "Ritual", description: "Repeated or sacred practice as narrative object.", family: OntologyFamily.NARRATIVE },
  { key: "object", name: "Object", description: "Artifact, heirloom, tool, or tangible story prop.", family: OntologyFamily.ENTITY },
  { key: "symbol", name: "Symbol", description: "Symbolic carrier (smoke, water, food, etc.).", family: OntologyFamily.NARRATIVE },
  { key: "motif", name: "Motif", description: "Recurring narrative pattern or image.", family: OntologyFamily.NARRATIVE },
  { key: "theme", name: "Theme", description: "Thematic statement or core idea.", family: OntologyFamily.NARRATIVE },
  { key: "source", name: "Source", description: "Archive or research source document.", family: OntologyFamily.SUPPORT },
  { key: "claim", name: "Claim", description: "Atomic truth statement tied to evidence.", family: OntologyFamily.SUPPORT },
  { key: "contradiction", name: "Contradiction", description: "Explicit tension between claims or accounts.", family: OntologyFamily.SUPPORT },
  { key: "question", name: "Question", description: "Open research or narrative question.", family: OntologyFamily.SUPPORT },
  { key: "chapter", name: "Chapter", description: "Book chapter container.", family: OntologyFamily.NARRATIVE },
  { key: "scene", name: "Scene", description: "Draft or prose scene unit.", family: OntologyFamily.NARRATIVE },
  { key: "meta_scene", name: "Meta scene", description: "Simulation / experience layer over events.", family: OntologyFamily.SIMULATION },
  { key: "fragment", name: "Fragment", description: "Decomposed narrative or research fragment.", family: OntologyFamily.NARRATIVE },
  { key: "memory_unit", name: "Memory unit", description: "Structured memory object for non-linear recall.", family: OntologyFamily.SIMULATION },
  { key: "pressure_source", name: "Pressure source", description: "External force compressing choice (law, church, economy).", family: OntologyFamily.SIMULATION },
  { key: "relationship", name: "Relationship", description: "Edge between people or groups.", family: OntologyFamily.RELATIONSHIP },
  { key: "anchor", name: "Anchor", description: "Temporal or narrative anchor (hard/soft/hidden).", family: OntologyFamily.SIMULATION },
  { key: "branch_condition", name: "Branch condition", description: "Deterministic branch gate or condition.", family: OntologyFamily.SIMULATION },
  { key: "variable_set", name: "Variable set", description: "Bundle of simulation variables for a slice.", family: OntologyFamily.SIMULATION },
];

type RegRow = { key: string; label: string; family: RegistryFamily; sortOrder?: number; description?: string };

const REGISTRY: RegRow[] = [
  // SYMBOLIC
  { key: "symbolic_elemental", label: "elemental", family: RegistryFamily.SYMBOLIC, sortOrder: 10 },
  { key: "symbolic_culinary", label: "culinary", family: RegistryFamily.SYMBOLIC, sortOrder: 20 },
  { key: "symbolic_ritual", label: "ritual", family: RegistryFamily.SYMBOLIC, sortOrder: 30 },
  { key: "symbolic_religious", label: "religious", family: RegistryFamily.SYMBOLIC, sortOrder: 40 },
  { key: "symbolic_environmental", label: "environmental", family: RegistryFamily.SYMBOLIC, sortOrder: 50 },
  { key: "symbolic_bodily", label: "bodily", family: RegistryFamily.SYMBOLIC, sortOrder: 60 },
  { key: "symbolic_domestic", label: "domestic", family: RegistryFamily.SYMBOLIC, sortOrder: 70 },
  { key: "symbolic_threshold", label: "threshold", family: RegistryFamily.SYMBOLIC, sortOrder: 80 },
  { key: "symbolic_inheritance", label: "inheritance", family: RegistryFamily.SYMBOLIC, sortOrder: 90 },
  { key: "symbolic_violence_memory", label: "violence_memory", family: RegistryFamily.SYMBOLIC, sortOrder: 100 },
  // RELATIONSHIP
  { key: "rel_kinship", label: "kinship", family: RegistryFamily.RELATIONSHIP, sortOrder: 10 },
  { key: "rel_alliance", label: "alliance", family: RegistryFamily.RELATIONSHIP, sortOrder: 20 },
  { key: "rel_debt", label: "debt", family: RegistryFamily.RELATIONSHIP, sortOrder: 30 },
  { key: "rel_secrecy", label: "secrecy", family: RegistryFamily.RELATIONSHIP, sortOrder: 40 },
  { key: "rel_dependence", label: "dependence", family: RegistryFamily.RELATIONSHIP, sortOrder: 50 },
  { key: "rel_protection", label: "protection", family: RegistryFamily.RELATIONSHIP, sortOrder: 60 },
  { key: "rel_domination", label: "domination", family: RegistryFamily.RELATIONSHIP, sortOrder: 70 },
  { key: "rel_translation_bridge", label: "translation_bridge", family: RegistryFamily.RELATIONSHIP, sortOrder: 80 },
  { key: "rel_racialized_surveillance", label: "racialized_surveillance", family: RegistryFamily.RELATIONSHIP, sortOrder: 90 },
  { key: "rel_spiritual_authority", label: "spiritual_authority", family: RegistryFamily.RELATIONSHIP, sortOrder: 100 },
  { key: "rel_economic_leverage", label: "economic_leverage", family: RegistryFamily.RELATIONSHIP, sortOrder: 110 },
  { key: "rel_grief_bond", label: "grief_bond", family: RegistryFamily.RELATIONSHIP, sortOrder: 120 },
  { key: "rel_symbolic_inheritance", label: "symbolic_inheritance", family: RegistryFamily.RELATIONSHIP, sortOrder: 130 },
  // ENVIRONMENT
  { key: "env_settlement", label: "settlement", family: RegistryFamily.ENVIRONMENT, sortOrder: 10 },
  { key: "env_trade_corridor", label: "trade_corridor", family: RegistryFamily.ENVIRONMENT, sortOrder: 20 },
  { key: "env_threshold_zone", label: "threshold_zone", family: RegistryFamily.ENVIRONMENT, sortOrder: 30 },
  { key: "env_ritual_zone", label: "ritual_zone", family: RegistryFamily.ENVIRONMENT, sortOrder: 40 },
  { key: "env_domestic_zone", label: "domestic_zone", family: RegistryFamily.ENVIRONMENT, sortOrder: 50 },
  { key: "env_danger_zone", label: "danger_zone", family: RegistryFamily.ENVIRONMENT, sortOrder: 60 },
  { key: "env_hidden_zone", label: "hidden_zone", family: RegistryFamily.ENVIRONMENT, sortOrder: 70 },
  { key: "env_crossing_zone", label: "crossing_zone", family: RegistryFamily.ENVIRONMENT, sortOrder: 80 },
  { key: "env_water_body", label: "water_body", family: RegistryFamily.ENVIRONMENT, sortOrder: 90 },
  { key: "env_burial_ground", label: "burial_ground", family: RegistryFamily.ENVIRONMENT, sortOrder: 100 },
  { key: "env_sacred_site", label: "sacred_site", family: RegistryFamily.ENVIRONMENT, sortOrder: 110 },
  { key: "env_forest_margin", label: "forest_margin", family: RegistryFamily.ENVIRONMENT, sortOrder: 120 },
  // PRESSURE
  { key: "pressure_colonial_order", label: "colonial_order", family: RegistryFamily.PRESSURE, sortOrder: 10 },
  { key: "pressure_racial_hierarchy", label: "racial_hierarchy", family: RegistryFamily.PRESSURE, sortOrder: 20 },
  { key: "pressure_church_power", label: "church_power", family: RegistryFamily.PRESSURE, sortOrder: 30 },
  { key: "pressure_property_law", label: "property_law", family: RegistryFamily.PRESSURE, sortOrder: 40 },
  { key: "pressure_family_expectation", label: "family_expectation", family: RegistryFamily.PRESSURE, sortOrder: 50 },
  { key: "pressure_economic_precarity", label: "economic_precarity", family: RegistryFamily.PRESSURE, sortOrder: 60 },
  { key: "pressure_war_threat", label: "war_threat", family: RegistryFamily.PRESSURE, sortOrder: 70 },
  { key: "pressure_bureaucracy", label: "bureaucracy", family: RegistryFamily.PRESSURE, sortOrder: 80 },
  { key: "pressure_masculine_code", label: "masculine_code", family: RegistryFamily.PRESSURE, sortOrder: 90 },
  { key: "pressure_feminine_labor_burden", label: "feminine_labor_burden", family: RegistryFamily.PRESSURE, sortOrder: 100 },
  { key: "pressure_caste_ambiguity", label: "caste_ambiguity", family: RegistryFamily.PRESSURE, sortOrder: 110 },
  { key: "pressure_language_hierarchy", label: "language_hierarchy", family: RegistryFamily.PRESSURE, sortOrder: 120 },
  { key: "pressure_public_reputation_logic", label: "public_reputation_logic", family: RegistryFamily.PRESSURE, sortOrder: 130 },
  // PERMISSION (vocabulary; mirrors NarrativePermissionProfile keys)
  { key: "perm_unusable", label: "unusable", family: RegistryFamily.PERMISSION, sortOrder: 10 },
  { key: "perm_support_only", label: "support_only", family: RegistryFamily.PERMISSION, sortOrder: 20 },
  { key: "perm_scene_support", label: "scene_support", family: RegistryFamily.PERMISSION, sortOrder: 30 },
  { key: "perm_atmosphere_support", label: "atmosphere_support", family: RegistryFamily.PERMISSION, sortOrder: 40 },
  { key: "perm_direct_narrative_use", label: "direct_narrative_use", family: RegistryFamily.PERMISSION, sortOrder: 50 },
  { key: "perm_canonical_reveal_use", label: "canonical_reveal_use", family: RegistryFamily.PERMISSION, sortOrder: 60 },
  // READINESS
  { key: "ready_not_ready", label: "not_ready", family: RegistryFamily.READINESS, sortOrder: 10 },
  { key: "ready_exploratory_only", label: "exploratory_only", family: RegistryFamily.READINESS, sortOrder: 20 },
  { key: "ready_constrained_draft_ready", label: "constrained_draft_ready", family: RegistryFamily.READINESS, sortOrder: 30 },
  { key: "ready_polished_prose_ready", label: "polished_prose_ready", family: RegistryFamily.READINESS, sortOrder: 40 },
  // BRANCH
  { key: "branch_locked", label: "locked", family: RegistryFamily.BRANCH, sortOrder: 10 },
  { key: "branch_elastic", label: "elastic", family: RegistryFamily.BRANCH, sortOrder: 20 },
  { key: "branch_conditional", label: "conditional", family: RegistryFamily.BRANCH, sortOrder: 30 },
  { key: "branch_hidden_conditional", label: "hidden_conditional", family: RegistryFamily.BRANCH, sortOrder: 40 },
  { key: "branch_convergence_required", label: "convergence_required", family: RegistryFamily.BRANCH, sortOrder: 50 },
  { key: "branch_terminal", label: "terminal", family: RegistryFamily.BRANCH, sortOrder: 60 },
];

const NARR_PERM: {
  key: string;
  name: string;
  allowsDirectNarrativeUse: boolean;
  allowsSceneSupport: boolean;
  allowsAtmosphereSupport: boolean;
  allowsCanonicalReveal: boolean;
}[] = [
  { key: "unusable", name: "Unusable", allowsDirectNarrativeUse: false, allowsSceneSupport: false, allowsAtmosphereSupport: false, allowsCanonicalReveal: false },
  { key: "support_only", name: "Support only", allowsDirectNarrativeUse: false, allowsSceneSupport: false, allowsAtmosphereSupport: false, allowsCanonicalReveal: false },
  { key: "scene_support", name: "Scene support", allowsDirectNarrativeUse: false, allowsSceneSupport: true, allowsAtmosphereSupport: false, allowsCanonicalReveal: false },
  { key: "atmosphere_support", name: "Atmosphere support", allowsDirectNarrativeUse: false, allowsSceneSupport: false, allowsAtmosphereSupport: true, allowsCanonicalReveal: false },
  { key: "direct_narrative_use", name: "Direct narrative use", allowsDirectNarrativeUse: true, allowsSceneSupport: true, allowsAtmosphereSupport: true, allowsCanonicalReveal: false },
  { key: "canonical_reveal_use", name: "Canonical reveal use", allowsDirectNarrativeUse: true, allowsSceneSupport: true, allowsAtmosphereSupport: true, allowsCanonicalReveal: true },
];

const CONFIDENCE: { key: string; label: string; numericValue: number }[] = [
  { key: "speculative", label: "speculative", numericValue: 1 },
  { key: "weak_oral", label: "weak_oral", numericValue: 2 },
  { key: "plausible_partial", label: "plausible_partial", numericValue: 3 },
  { key: "strong_support", label: "strong_support", numericValue: 4 },
  { key: "directly_documented", label: "directly_documented", numericValue: 5 },
];

const READINESS: { key: string; label: string; isDraftable: boolean }[] = [
  { key: "not_ready", label: "not_ready", isDraftable: false },
  { key: "exploratory_only", label: "exploratory_only", isDraftable: false },
  { key: "constrained_draft_ready", label: "constrained_draft_ready", isDraftable: true },
  { key: "polished_prose_ready", label: "polished_prose_ready", isDraftable: true },
];

export async function seedOntology(): Promise<void> {
  for (const row of ONTOLOGY_ROWS) {
    await prisma.ontologyType.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        description: row.description,
        family: row.family,
        isActive: true,
        recordType: RT,
        visibility: VIS,
      },
      create: {
        key: row.key,
        name: row.name,
        description: row.description,
        family: row.family,
        isActive: true,
        recordType: RT,
        visibility: VIS,
        sourceTraceNote: "seed:ontology",
      },
    });
  }

  for (const row of REGISTRY) {
    await prisma.registryValue.upsert({
      where: { key: row.key },
      update: {
        label: row.label,
        family: row.family,
        sortOrder: row.sortOrder ?? 0,
        isActive: true,
        registryType: "catalog_v1",
        description: row.description ?? null,
      },
      create: {
        key: row.key,
        label: row.label,
        description: row.description ?? null,
        family: row.family,
        sortOrder: row.sortOrder ?? 0,
        isActive: true,
        registryType: "catalog_v1",
        sourceTraceNote: "seed:ontology",
      },
    });
  }

  for (const row of NARR_PERM) {
    await prisma.narrativePermissionProfile.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        allowsDirectNarrativeUse: row.allowsDirectNarrativeUse,
        allowsSceneSupport: row.allowsSceneSupport,
        allowsAtmosphereSupport: row.allowsAtmosphereSupport,
        allowsCanonicalReveal: row.allowsCanonicalReveal,
        isActive: true,
      },
      create: {
        key: row.key,
        name: row.name,
        allowsDirectNarrativeUse: row.allowsDirectNarrativeUse,
        allowsSceneSupport: row.allowsSceneSupport,
        allowsAtmosphereSupport: row.allowsAtmosphereSupport,
        allowsCanonicalReveal: row.allowsCanonicalReveal,
        isActive: true,
        recordType: RT,
        visibility: VIS,
      },
    });
  }

  for (const row of CONFIDENCE) {
    await prisma.confidenceProfile.upsert({
      where: { key: row.key },
      update: { label: row.label, numericValue: row.numericValue, isActive: true },
      create: {
        key: row.key,
        label: row.label,
        numericValue: row.numericValue,
        isActive: true,
        recordType: RT,
        visibility: VIS,
      },
    });
  }

  for (const row of READINESS) {
    await prisma.sceneReadinessProfile.upsert({
      where: { key: row.key },
      update: { label: row.label, isDraftable: row.isDraftable, isActive: true },
      create: {
        key: row.key,
        label: row.label,
        isDraftable: row.isDraftable,
        isActive: true,
        recordType: RT,
        visibility: VIS,
      },
    });
  }
}
