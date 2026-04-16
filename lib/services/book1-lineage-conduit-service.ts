import type { Book1OutlineEntity } from "@/lib/services/book1-epic-outline-builder";

export const MATRIARCH_LINE_NAMES = ["First Matriarch", "Second Matriarch", "Third Matriarch", "Fourth Matriarch"] as const;

const MATRIARCH_ALIAS_HINTS = [/first matriarch/i, /second matriarch/i, /third matriarch/i, /fourth matriarch/i];
const DESCENDANT_NAME_HINTS = [/alexis/i, /buford/i, /fran[cç]ois/i, /coincoin/i];

const DEFAULT_FUTURE_DESCENDANTS = ["Alexis", "Alexis Grappe", "Francois Grappe", "Buford Grappe", "Coincoin"];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseNotesJson(raw: string | null | undefined): Record<string, unknown> {
  const value = compact(raw ?? "");
  if (!value.startsWith("{")) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function isMatriarchByName(name: string): boolean {
  const normalized = compact(name).toLowerCase();
  if (MATRIARCH_LINE_NAMES.map((row) => row.toLowerCase()).includes(normalized)) return true;
  return MATRIARCH_ALIAS_HINTS.some((pattern) => pattern.test(name));
}

function isLikelyFutureDescendant(entity: Book1OutlineEntity): boolean {
  const descriptor = `${entity.displayName} ${entity.description ?? ""} ${entity.notes ?? ""}`;
  return DESCENDANT_NAME_HINTS.some((pattern) => pattern.test(descriptor));
}

export type Book1LineageConduitEntity = Book1OutlineEntity & {
  ancestral_priority: number;
  direct_lineage_conduit: boolean;
  chronology_protection: boolean;
  future_descendant_links: string[];
};

export function annotateLineageConduitEntities(entities: Book1OutlineEntity[]): Book1LineageConduitEntity[] {
  const annotated = entities.map((entity) => {
    const notes = parseNotesJson(entity.notes);
    const futureLinksFromNotes = Array.isArray(notes.future_descendant_links)
      ? notes.future_descendant_links.filter((row): row is string => typeof row === "string")
      : [];
    const isMatriarch = isMatriarchByName(entity.displayName);
    const future_descendant_links = isMatriarch ? DEFAULT_FUTURE_DESCENDANTS : futureLinksFromNotes;
    return {
      ...entity,
      ancestral_priority: isMatriarch ? 1 : 0,
      direct_lineage_conduit: isMatriarch,
      chronology_protection: isMatriarch,
      future_descendant_links,
    };
  });
  const existing = new Set(annotated.map((entity) => compact(entity.displayName).toLowerCase()));
  for (const matriarch of MATRIARCH_LINE_NAMES) {
    if (existing.has(matriarch.toLowerCase())) continue;
    annotated.push({
      id: `synthetic-${matriarch.toLowerCase().replace(/\s+/g, "-")}`,
      displayName: matriarch,
      entityType: "PERSON",
      description: "Synthetic protected ancestral-canon placeholder for lineage-conduit continuity.",
      startYear: null,
      endYear: null,
      notes: JSON.stringify({ synthetic: true, generatedBy: "book1-lineage-conduit-service" }),
      lineageLinked: true,
      ancestral_priority: 1,
      direct_lineage_conduit: true,
      chronology_protection: true,
      future_descendant_links: DEFAULT_FUTURE_DESCENDANTS,
    });
  }
  return annotated;
}

export function isFutureDescendantOnlyEntity(entity: Book1LineageConduitEntity): boolean {
  if (entity.direct_lineage_conduit) return false;
  return isLikelyFutureDescendant(entity);
}

export function isEarlyChapterRange(range: string): boolean {
  const match = range.match(/(\d{4})\s*-\s*(\d{4})/);
  if (!match) return /before\s+1680/i.test(range);
  const end = Number.parseInt(match[2], 10);
  return Number.isFinite(end) && end <= 1680;
}
