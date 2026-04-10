/**
 * Generates split JSON handoff reports for AI / documentation:
 * - reports/campti-handoff-filesystem.json — repo tree, routes, npm scripts, deps
 * - reports/campti-handoff-story.json — Prisma story graph from DATABASE_URL
 * - reports/campti-handoff-index.json — pointers + shared metadata
 *
 * Optional: --combined-out <path> writes the legacy single-file merge.
 *
 * Usage: npx tsx scripts/generate-handoff-report.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../lib/prisma";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCLUDE_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  "coverage",
  ".vercel",
]);

const EXCLUDE_FILE_PREFIXES = [".env.local", ".env.production"];

type FileEntry = {
  relativePath: string;
  bytes: number;
  kind: "file" | "directory";
  role?: string;
};

function shouldSkipDir(name: string): boolean {
  return EXCLUDE_DIR_NAMES.has(name);
}

function inferRole(rel: string): string | undefined {
  const n = rel.replace(/\\/g, "/");
  if (n === "package.json") return "npm manifest + scripts";
  if (n === "prisma/schema.prisma") return "database schema";
  if (n.startsWith("prisma/") && n.endsWith(".ts")) return "prisma seed / migration helper";
  if (n.startsWith("app/") && n.endsWith("/page.tsx")) {
    const parts = n.split("/");
    const seg = parts.slice(1, -1).join("/");
    return `Next.js route /${seg}`;
  }
  if (n.startsWith("app/") && (n.endsWith("layout.tsx") || n.endsWith("layout.ts")))
    return "Next.js layout";
  if (n.startsWith("app/api/")) return "API route";
  if (n.startsWith("lib/")) return "shared library";
  if (n.startsWith("components/")) return "React components";
  if (n.startsWith("scripts/")) return "CLI / ingestion script";
  if (n.startsWith("public/")) return "static assets";
  return undefined;
}

function walk(
  absRoot: string,
  relRoot: string,
  entries: FileEntry[],
  maxFiles: number,
): void {
  if (entries.length >= maxFiles) return;
  let names: string[];
  try {
    names = fs.readdirSync(path.join(absRoot, relRoot));
  } catch {
    return;
  }
  for (const name of names.sort()) {
    if (entries.length >= maxFiles) return;
    if (EXCLUDE_FILE_PREFIXES.some((p) => name.startsWith(p))) continue;
    const rel = relRoot ? `${relRoot}/${name}` : name;
    const abs = path.join(absRoot, rel);
    let st: fs.Stats;
    try {
      st = fs.lstatSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (shouldSkipDir(name)) continue;
      entries.push({
        relativePath: rel.split(path.sep).join("/"),
        bytes: 0,
        kind: "directory",
        role: inferRole(rel.split(path.sep).join("/")),
      });
      walk(absRoot, rel, entries, maxFiles);
    } else if (st.isFile()) {
      entries.push({
        relativePath: rel.split(path.sep).join("/"),
        bytes: st.size,
        kind: "file",
        role: inferRole(rel.split(path.sep).join("/")),
      });
    }
  }
}

async function loadStorySnapshot(): Promise<Record<string, unknown>> {
  try {
    const [
      chapters,
      scenes,
      people,
      places,
      symbols,
      themes,
      motifs,
      narrativeRules,
      literaryDevices,
      narrativePatterns,
      narrativeBindings,
      fragments,
      fragmentClusters,
      events,
      sources,
      claims,
      openQuestions,
      continuityNotes,
      metaScenes,
      characterRelationships,
      aliases,
    ] = await Promise.all([
      prisma.chapter.findMany({
        orderBy: [{ chapterNumber: "asc" }],
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          summary: true,
          status: true,
          recordType: true,
          visibility: true,
        },
      }),
      prisma.scene.findMany({
        orderBy: [{ chapterId: "asc" }, { orderInChapter: "asc" }],
        select: {
          id: true,
          chapterId: true,
          sceneNumber: true,
          orderInChapter: true,
          description: true,
          summary: true,
          recordType: true,
        },
      }),
      prisma.person.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true, recordType: true },
      }),
      prisma.place.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, placeType: true, description: true, recordType: true },
      }),
      prisma.symbol.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          meaning: true,
          meaningPrimary: true,
          category: true,
          recordType: true,
        },
      }),
      prisma.theme.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true, category: true, intensity: true },
      }),
      prisma.motif.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true, usagePattern: true },
      }),
      prisma.narrativeRule.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, description: true, category: true, strength: true, scope: true },
      }),
      prisma.literaryDevice.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true, systemEffect: true },
      }),
      prisma.narrativePattern.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, description: true, patternType: true, strength: true },
      }),
      prisma.narrativeBinding.findMany({
        orderBy: { id: "asc" },
        select: {
          id: true,
          sourceType: true,
          sourceId: true,
          targetType: true,
          targetId: true,
          relationship: true,
          strength: true,
          notes: true,
        },
      }),
      prisma.fragment.findMany({
        orderBy: { id: "asc" },
        take: 400,
        select: {
          id: true,
          title: true,
          fragmentType: true,
          summary: true,
          text: true,
          recordType: true,
        },
      }),
      prisma.fragmentCluster.findMany({
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          clusterType: true,
          summary: true,
          chapterId: true,
          sceneId: true,
          symbolId: true,
        },
      }),
      prisma.event.findMany({
        orderBy: { startYear: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          eventType: true,
          startYear: true,
          recordType: true,
        },
      }),
      prisma.source.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, sourceType: true, recordType: true, summary: true },
      }),
      prisma.claim.findMany({
        orderBy: { id: "asc" },
        select: { id: true, description: true, confidence: true, recordType: true, needsReview: true },
      }),
      prisma.openQuestion.findMany({
        orderBy: { priority: "asc" },
        select: { id: true, title: true, description: true, status: true, priority: true },
      }),
      prisma.continuityNote.findMany({
        orderBy: { severity: "asc" },
        select: { id: true, title: true, description: true, severity: true, status: true },
      }),
      prisma.metaScene.findMany({
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          sceneId: true,
          placeId: true,
          povPersonId: true,
          timePeriod: true,
          narrativePurpose: true,
          symbolicElements: true,
          centralConflict: true,
          emotionalVoltage: true,
        },
      }),
      prisma.characterRelationship.findMany({
        orderBy: { id: "asc" },
        select: {
          id: true,
          personAId: true,
          personBId: true,
          relationshipType: true,
          relationshipSummary: true,
        },
      }),
      prisma.alias.findMany({
        orderBy: { label: "asc" },
        take: 200,
        select: { id: true, label: true, entityType: true, entityId: true },
      }),
    ]);

    const characterProfiles = await prisma.characterProfile.findMany({
      orderBy: { personId: "asc" },
      select: {
        personId: true,
        worldview: true,
        coreBeliefs: true,
        desires: true,
        fears: true,
        internalConflicts: true,
        emotionalBaseline: true,
        enneagramType: true,
        notes: true,
      },
    });
    const peopleById = new Map(people.map((p) => [p.id, p.name]));
    const characterProfilesWithNames = characterProfiles.map((cp) => ({
      ...cp,
      personName: peopleById.get(cp.personId) ?? null,
    }));

    const fragmentCount = await prisma.fragment.count();
    const fragmentNote =
      fragmentCount > 400
        ? `Listed first 400 of ${fragmentCount} fragments; full count in counts.`
        : undefined;

    const chapterSceneOutline = chapters.map((ch) => ({
      chapter: {
        id: ch.id,
        title: ch.title,
        chapterNumber: ch.chapterNumber,
        summary: ch.summary,
        status: ch.status,
      },
      scenes: scenes
        .filter((s) => s.chapterId === ch.id)
        .map((s) => ({
          id: s.id,
          orderInChapter: s.orderInChapter,
          sceneNumber: s.sceneNumber,
          description: s.description,
          summary: s.summary,
        })),
    }));

    return {
      counts: {
        chapters: chapters.length,
        scenes: scenes.length,
        people: people.length,
        places: places.length,
        symbols: symbols.length,
        themes: themes.length,
        motifs: motifs.length,
        narrativeRules: narrativeRules.length,
        literaryDevices: literaryDevices.length,
        narrativePatterns: narrativePatterns.length,
        narrativeBindings: narrativeBindings.length,
        fragments: fragmentCount,
        fragmentClusters: fragmentClusters.length,
        events: events.length,
        sources: sources.length,
        claims: claims.length,
        openQuestions: openQuestions.length,
        continuityNotes: continuityNotes.length,
        metaScenes: metaScenes.length,
        characterRelationships: characterRelationships.length,
        aliases: aliases.length,
        characterProfiles: characterProfiles.length,
      },
      fragmentSampleNote: fragmentNote,
      chapterSceneOutline,
      characterProfiles: characterProfilesWithNames,
      chapters,
      scenes,
      people,
      places,
      symbols,
      themes,
      motifs,
      narrativeRules,
      literaryDevices,
      narrativePatterns,
      narrativeBindings,
      fragments: fragments.map((f) => ({
        ...f,
        text:
          f.text && f.text.length > 500
            ? `${f.text.slice(0, 500)}… [truncated, ${f.text.length} chars total]`
            : f.text,
      })),
      fragmentClusters,
      events,
      sources,
      claims,
      openQuestions,
      continuityNotes,
      metaScenes,
      characterRelationships,
      aliases,
    };
  } catch (e) {
    return {
      error: "database_query_failed",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

function writeJson(filePath: string, obj: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const json = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, json, "utf8");
  console.log(`Wrote ${filePath} (${Buffer.byteLength(json, "utf8")} bytes)`);
}

async function main() {
  const args = process.argv.slice(2);
  let combinedOut: string | null = null;
  const cidx = args.indexOf("--combined-out");
  if (cidx >= 0 && args[cidx + 1]) combinedOut = path.resolve(args[cidx + 1]);

  const reportsDir = path.resolve(__dirname, "..", "reports");
  const defaultFs = path.join(reportsDir, "campti-handoff-filesystem.json");
  const defaultStory = path.join(reportsDir, "campti-handoff-story.json");
  const defaultIndex = path.join(reportsDir, "campti-handoff-index.json");

  let fsOut = defaultFs;
  let storyOut = defaultStory;
  let indexOut = defaultIndex;
  const fsi = args.indexOf("--filesystem-out");
  if (fsi >= 0 && args[fsi + 1]) fsOut = path.resolve(args[fsi + 1]);
  const si = args.indexOf("--story-out");
  if (si >= 0 && args[si + 1]) storyOut = path.resolve(args[si + 1]);
  const ii = args.indexOf("--index-out");
  if (ii >= 0 && args[ii + 1]) indexOut = path.resolve(args[ii + 1]);

  const repoRoot = path.resolve(__dirname, "..");
  const generatedAt = new Date().toISOString();

  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    name?: string;
    version?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    prisma?: { seed?: string };
  };

  const maxFiles = Number(process.env.HANDOFF_MAX_FILES ?? "25000");
  const fileEntries: FileEntry[] = [];
  walk(repoRoot, "", fileEntries, maxFiles);

  const totalBytes = fileEntries.filter((e) => e.kind === "file").reduce((a, e) => a + e.bytes, 0);
  const truncated = fileEntries.length >= maxFiles;

  const byTopLevel: Record<string, { files: number; bytes: number }> = {};
  for (const e of fileEntries) {
    if (e.kind !== "file") continue;
    const top = e.relativePath.split("/")[0] ?? "(root)";
    if (!byTopLevel[top]) byTopLevel[top] = { files: 0, bytes: 0 };
    byTopLevel[top].files += 1;
    byTopLevel[top].bytes += e.bytes;
  }

  const routes = fileEntries
    .filter((e) => e.kind === "file" && e.relativePath.startsWith("app/") && e.relativePath.endsWith("/page.tsx"))
    .map((e) => ({
      path: "/" + e.relativePath.replace(/^app\//, "").replace(/\/page\.tsx$/, ""),
      file: e.relativePath,
      bytes: e.bytes,
    }));

  const prismaSchemaPath = path.join(repoRoot, "prisma", "schema.prisma");
  let prismaSchemaBytes = 0;
  try {
    prismaSchemaBytes = fs.statSync(prismaSchemaPath).size;
  } catch {
    /* ignore */
  }

  const storySnapshot = await loadStorySnapshot();
  await prisma.$disconnect().catch(() => undefined);

  const filesystemReport = {
    kind: "filesystem" as const,
    handoffVersion: 2,
    generatedAt,
    purpose:
      "Repository and build layout: files, routes, npm scripts, dependencies. Pair with campti-handoff-story.json for narrative state.",
    repository: {
      name: pkg.name ?? "campti",
      version: pkg.version ?? "0.0.0",
      rootPath: repoRoot,
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
    },
    executablesAndScripts: {
      npmScripts: pkg.scripts ?? {},
      narrative: {
        note: "All ingestion is TypeScript run via tsx; there are no Python scripts in this repo.",
        scriptFiles: fileEntries
          .filter((e) => e.kind === "file" && e.relativePath.startsWith("scripts/"))
          .map((e) => ({ file: e.relativePath, bytes: e.bytes, role: e.role })),
      },
    },
    dependencies: {
      production: pkg.dependencies ?? {},
      development: pkg.devDependencies ?? {},
    },
    prisma: {
      schemaFile: "prisma/schema.prisma",
      schemaBytes: prismaSchemaBytes,
      seedCommand: pkg.prisma?.seed ?? null,
      note: "PostgreSQL via DATABASE_URL; Prisma Client generated on postinstall/build.",
    },
    nextJs: {
      appRouterRoots: ["app/"],
      routesDiscovered: routes,
      routeCount: routes.length,
    },
    filesystem: {
      excludeDirectoryNames: [...EXCLUDE_DIR_NAMES],
      maxFilesScanned: maxFiles,
      truncated,
      totalEntries: fileEntries.length,
      totalFileBytesIndexed: totalBytes,
      filesByTopLevelFolder: byTopLevel,
      entries: fileEntries,
    },
  };

  const storyReport = {
    kind: "story" as const,
    handoffVersion: 2,
    generatedAt,
    purpose:
      "Narrative graph exported from the database (themes, symbols, chapters, scenes, bindings, etc.). Requires DATABASE_URL when generating.",
    repository: {
      name: pkg.name ?? "campti",
      version: pkg.version ?? "0.0.0",
      rootPath: repoRoot,
    },
    readingAndAdminUrls: {
      readHub: "/read",
      adminDashboard: "/admin/dashboard",
    },
    storySystemFromDatabase: storySnapshot,
  };

  const rel = (abs: string) => path.relative(repoRoot, abs).split(path.sep).join("/");

  const indexReport = {
    kind: "index" as const,
    handoffVersion: 2,
    generatedAt,
    purpose:
      "Entry point: open filesystem JSON for repo structure, story JSON for literary/narrative database state.",
    repository: {
      name: pkg.name ?? "campti",
      version: pkg.version ?? "0.0.0",
      rootPath: repoRoot,
    },
    artifacts: {
      filesystem: rel(fsOut),
      story: rel(storyOut),
    },
    runtime: {
      node: process.version,
      platform: process.platform,
    },
  };

  writeJson(fsOut, filesystemReport);
  writeJson(storyOut, storyReport);
  writeJson(indexOut, indexReport);

  if (combinedOut) {
    const merged = {
      handoffVersion: 2,
      generatedAt,
      purpose:
        "Legacy combined export (filesystem + story). Prefer campti-handoff-index.json and split artifacts for large uploads.",
      repository: filesystemReport.repository,
      runtime: filesystemReport.runtime,
      executablesAndScripts: filesystemReport.executablesAndScripts,
      dependencies: filesystemReport.dependencies,
      prisma: filesystemReport.prisma,
      nextJs: filesystemReport.nextJs,
      filesystem: filesystemReport.filesystem,
      storySystemFromDatabase: storyReport.storySystemFromDatabase,
      readingAndAdminUrls: storyReport.readingAndAdminUrls,
    };
    writeJson(combinedOut, merged);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
