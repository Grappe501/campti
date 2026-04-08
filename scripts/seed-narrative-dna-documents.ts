/**
 * Seeds narrative DNA rows for known Campti document sources (Overview, Thematic, Section IX doc, Genealogy/timeline).
 * Idempotent: upserts by fixed IDs. Does not call OpenAI.
 * Run: npm run db:narrative-dna
 */
import "./load-env";
import { RecordType, SourceType, VisibilityStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const SOURCES = [
  {
    id: "source-campti-section-i-overview",
    title: "Section I — Overview (Campti narrative bible)",
  },
  {
    id: "source-campti-section-iv-thematic",
    title: "Section IV — Thematic Framework",
  },
  {
    id: "source-narrative-system-subthemes",
    title: "Narrative System – Subthemes, Motifs, and Literary Devices",
  },
  {
    id: "source-historical-timeline-grappe-anchors",
    title: "Historical Timeline – Grappe Narrative Anchors",
  },
] as const;

async function ensureSource(id: string, title: string) {
  await prisma.source.upsert({
    where: { id },
    update: {
      title,
      archiveStatus: "reviewed",
      ingestionReady: false,
    },
    create: {
      id,
      title,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      archiveStatus: "reviewed",
      ingestionReady: false,
      ingestionStatus: "dna_seeded",
    },
  });
}

async function seedDnaForSource(
  sourceId: string,
  pack: {
    rule?: { id: string; title: string; description: string; category: string };
    theme?: { id: string; name: string; description: string };
    pattern?: { id: string; title: string; description: string; patternType: string };
  },
) {
  if (pack.rule) {
    await prisma.narrativeRule.upsert({
      where: { id: pack.rule.id },
      update: {
        title: pack.rule.title,
        description: pack.rule.description,
        category: pack.rule.category,
        sourceId,
      },
      create: {
        id: pack.rule.id,
        title: pack.rule.title,
        description: pack.rule.description,
        category: pack.rule.category,
        strength: 4,
        scope: "global",
        sourceId,
        notes: "Seeded — refine after full document ingestion.",
      },
    });
    await prisma.narrativeBinding.upsert({
      where: { id: `bind-${pack.rule.id}-src` },
      update: { notes: "Seed" },
      create: {
        id: `bind-${pack.rule.id}-src`,
        sourceType: "narrative_rule",
        sourceId: pack.rule.id,
        targetType: "source",
        targetId: sourceId,
        relationship: "emerges_from",
        strength: 4,
        notes: "Seed",
      },
    });
  }
  if (pack.theme) {
    await prisma.theme.upsert({
      where: { id: pack.theme.id },
      update: {
        name: pack.theme.name,
        description: pack.theme.description,
        sourceId,
      },
      create: {
        id: pack.theme.id,
        name: pack.theme.name,
        description: pack.theme.description,
        intensity: 4,
        category: "core",
        sourceId,
      },
    });
    await prisma.narrativeBinding.upsert({
      where: { id: `bind-${pack.theme.id}-src` },
      update: { notes: "Seed" },
      create: {
        id: `bind-${pack.theme.id}-src`,
        sourceType: "theme",
        sourceId: pack.theme.id,
        targetType: "source",
        targetId: sourceId,
        relationship: "emerges_from",
        strength: 4,
      },
    });
  }
  if (pack.pattern) {
    await prisma.narrativePattern.upsert({
      where: { id: pack.pattern.id },
      update: {
        title: pack.pattern.title,
        description: pack.pattern.description,
        patternType: pack.pattern.patternType,
        sourceId,
      },
      create: {
        id: pack.pattern.id,
        title: pack.pattern.title,
        description: pack.pattern.description,
        patternType: pack.pattern.patternType,
        strength: 4,
        sourceId,
      },
    });
    await prisma.narrativeBinding.upsert({
      where: { id: `bind-${pack.pattern.id}-src` },
      update: { notes: "Seed" },
      create: {
        id: `bind-${pack.pattern.id}-src`,
        sourceType: "narrative_pattern",
        sourceId: pack.pattern.id,
        targetType: "source",
        targetId: sourceId,
        relationship: "emerges_from",
        strength: 4,
      },
    });
  }
}

async function main() {
  for (const s of SOURCES) {
    await ensureSource(s.id, s.title);
  }

  await seedDnaForSource("source-campti-section-i-overview", {
    rule: {
      id: "dna-seed-overview-rule-structure",
      title: "Nonlinear truth is allowed",
      description:
        "The overview establishes that the narrative may move across time and teller; the system must not force a single chronological spine as the only valid reading.",
      category: "structure",
    },
    theme: {
      id: "dna-seed-overview-theme-place",
      name: "Place as witness",
      description: "Landscape and town hold memory that outlives individual narrators; setting is an active carrier of meaning.",
    },
  });

  await seedDnaForSource("source-campti-section-iv-thematic", {
    theme: {
      id: "dna-seed-thematic-theme-memory",
      name: "Memory vs record",
      description: "Emotional truth and documented fact can diverge; both remain legible in the model as separate layers.",
    },
    rule: {
      id: "dna-seed-thematic-rule-ambiguity",
      title: "Preserve interpretive gaps",
      description: "Do not collapse ambiguous family or historical material into a single authoritative reading in generation prompts.",
      category: "narration",
    },
  });

  await seedDnaForSource("source-narrative-system-subthemes", {
    rule: {
      id: "dna-seed-ix-rule-motif",
      title: "Motifs earn recurrence",
      description: "Recurring images should accrue meaning across scenes rather than repeating as decoration.",
      category: "symbolism",
    },
    pattern: {
      id: "dna-seed-ix-pattern-oral",
      title: "Oral cadence inheritance",
      description: "Dialogue and interior monologue may carry oral-storytelling rhythm even in close third.",
      patternType: "identity",
    },
  });

  await seedDnaForSource("source-historical-timeline-grappe-anchors", {
    pattern: {
      id: "dna-seed-genealogy-pattern-line",
      title: "Lineage shadows present action",
      description: "Present-day choices echo generational patterns; genealogy informs subtext, not exposition dumps.",
      patternType: "generational",
    },
    theme: {
      id: "dna-seed-genealogy-theme-time",
      name: "Anchored time",
      description: "Historical anchors constrain fantasy; when years or events are known, honor them in scene construction.",
    },
  });

  console.log("Narrative DNA seed complete for:", SOURCES.map((s) => s.id).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
