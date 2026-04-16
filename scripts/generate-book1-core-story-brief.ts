import "./load-env";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../lib/prisma";

const DEFAULT_SOURCE_ID = "book1-source-chunk-1";
const DEFAULT_JSON_OUT = "reports/book1-core-story-brief.json";
const DEFAULT_MD_OUT = "docs/build/book1-core-story-brief.md";

function parseArgs() {
  const args = process.argv.slice(2);
  let sourceId = DEFAULT_SOURCE_ID;
  let jsonOut = DEFAULT_JSON_OUT;
  let mdOut = DEFAULT_MD_OUT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source-id" && args[i + 1]) sourceId = args[++i];
    else if (args[i] === "--json-out" && args[i + 1]) jsonOut = args[++i];
    else if (args[i] === "--md-out" && args[i + 1]) mdOut = args[++i];
  }

  return {
    sourceId,
    jsonOut: path.resolve(jsonOut),
    mdOut: path.resolve(mdOut),
  };
}

function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function compact(text: string | null | undefined, max = 220): string {
  if (!text) return "";
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}...`;
}

function buildMarkdown(brief: {
  source: {
    id: string;
    title: string;
    filePath: string | null;
    rawChars: number;
    normalizedChars: number;
    chunkCount: number;
  };
  generatedAt: string;
  counts: Record<string, number>;
  chronology: Array<{ year: number | null; title: string; description: string | null }>;
  coreTruthSet: Array<{ id: string; description: string; confidence: number; quoteExcerpt: string | null }>;
  settingAnchors: Array<{ id: string; name: string; placeType: string; description: string | null }>;
  continuityConstraints: Array<{ id: string; title: string | null; summary: string | null; text: string }>;
  openResearchGaps: Array<{ id: string; title: string; description: string | null; priority: number | null }>;
}) {
  const lines: string[] = [];
  lines.push("# Book 1 Core Story Brief");
  lines.push("");
  lines.push(`Generated: ${brief.generatedAt}`);
  lines.push(`Source: ${brief.source.title} (\`${brief.source.id}\`)`);
  lines.push("");
  lines.push("## Source Snapshot");
  lines.push(`- File path: \`${brief.source.filePath ?? "n/a"}\``);
  lines.push(`- Raw chars: ${brief.source.rawChars}`);
  lines.push(`- Normalized chars: ${brief.source.normalizedChars}`);
  lines.push(`- Chunks: ${brief.source.chunkCount}`);
  lines.push("");
  lines.push("## Core Story Readiness");
  lines.push(`- Claims: ${brief.counts.claims}`);
  lines.push(`- Events: ${brief.counts.events}`);
  lines.push(`- Places: ${brief.counts.places}`);
  lines.push(`- Continuity Fragments: ${brief.counts.fragments}`);
  lines.push(`- Open Research Gaps: ${brief.counts.openQuestions}`);
  lines.push("");

  lines.push("## Chronology Spine");
  for (const ev of brief.chronology) {
    lines.push(`- ${ev.year ?? "Undated"} — ${ev.title}: ${compact(ev.description, 180)}`);
  }
  lines.push("");

  lines.push("## Core Truth Set");
  for (const claim of brief.coreTruthSet) {
    lines.push(
      `- (${claim.confidence}/5) ${claim.description}${claim.quoteExcerpt ? ` | Quote: "${compact(claim.quoteExcerpt, 140)}"` : ""}`,
    );
  }
  lines.push("");

  lines.push("## Setting Anchors");
  for (const place of brief.settingAnchors) {
    lines.push(`- ${place.name} [${place.placeType}]: ${compact(place.description, 180)}`);
  }
  lines.push("");

  lines.push("## Continuity Constraints");
  for (const frag of brief.continuityConstraints) {
    lines.push(`- ${frag.title ?? frag.id}: ${compact(frag.summary || frag.text, 200)}`);
  }
  lines.push("");

  lines.push("## Open Research Gaps");
  for (const q of brief.openResearchGaps) {
    lines.push(`- ${q.title}${q.priority ? ` (priority ${q.priority})` : ""}: ${compact(q.description, 180)}`);
  }
  lines.push("");

  lines.push("## Next Chapter Assembly Rule");
  lines.push(
    "- Do not promote a chapter beat to the core story unless it references at least one core claim, one chronology anchor (or explicit open gap), and one continuity constraint.",
  );

  return lines.join("\n");
}

async function main() {
  const { sourceId, jsonOut, mdOut } = parseArgs();

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      title: true,
      filePath: true,
      sourceText: {
        select: {
          rawText: true,
          normalizedText: true,
        },
      },
      sourceChunks: {
        select: { id: true },
      },
    },
  });

  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  const [claims, events, places, fragments, openQuestions] = await Promise.all([
    prisma.claim.findMany({
      where: { sourceId },
      orderBy: [{ confidence: "desc" }, { id: "asc" }],
      select: { id: true, description: true, confidence: true, quoteExcerpt: true, needsReview: true },
    }),
    prisma.event.findMany({
      where: {
        sources: { some: { id: sourceId } },
      },
      orderBy: [{ startYear: "asc" }, { title: "asc" }],
      select: { id: true, title: true, description: true, startYear: true, eventType: true },
    }),
    prisma.place.findMany({
      where: {
        sources: { some: { id: sourceId } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, placeType: true },
    }),
    prisma.fragment.findMany({
      where: { sourceId },
      orderBy: [{ confidence: "desc" }, { id: "asc" }],
      select: { id: true, title: true, summary: true, text: true, confidence: true, reviewStatus: true },
    }),
    prisma.openQuestion.findMany({
      where: { linkedSourceId: sourceId },
      orderBy: [{ priority: "asc" }, { id: "asc" }],
      select: { id: true, title: true, description: true, priority: true, status: true },
    }),
  ]);

  const brief = {
    generatedAt: new Date().toISOString(),
    source: {
      id: source.id,
      title: source.title,
      filePath: source.filePath,
      rawChars: source.sourceText?.rawText?.length ?? 0,
      normalizedChars: source.sourceText?.normalizedText?.length ?? 0,
      chunkCount: source.sourceChunks.length,
    },
    counts: {
      claims: claims.length,
      events: events.length,
      places: places.length,
      fragments: fragments.length,
      openQuestions: openQuestions.length,
    },
    chronology: events.map((e) => ({ year: e.startYear, title: e.title, description: e.description })),
    coreTruthSet: claims.map((c) => ({
      id: c.id,
      description: c.description,
      confidence: c.confidence,
      quoteExcerpt: c.quoteExcerpt,
      needsReview: c.needsReview,
    })),
    settingAnchors: places.map((p) => ({
      id: p.id,
      name: p.name,
      placeType: String(p.placeType),
      description: p.description,
    })),
    continuityConstraints: fragments.map((f) => ({
      id: f.id,
      title: f.title,
      summary: f.summary,
      text: compact(f.text, 600),
      confidence: f.confidence,
      reviewStatus: f.reviewStatus,
    })),
    openResearchGaps: openQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      priority: q.priority,
      status: q.status,
    })),
  };

  const markdown = buildMarkdown(brief);
  writeText(jsonOut, `${JSON.stringify(brief, null, 2)}\n`);
  writeText(mdOut, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceId,
        jsonOut,
        mdOut,
        counts: brief.counts,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
