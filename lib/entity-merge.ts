import type { ExtractedEntity } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { promoteExtractedByType } from "@/lib/promote-extracted";

type MergeFieldDecision =
  | "keep_canonical"
  | "use_extracted"
  | "append_note"
  | "create_alias"
  | "ignore";

export type MergeComparisonField = {
  key: string;
  label: string;
  canonicalValue: unknown;
  extractedValue: unknown;
  recommended: MergeFieldDecision;
  notes?: string;
  conflict?: boolean;
};

export type MergeComparison = {
  canonicalType: string;
  canonicalId: string;
  canonicalLabel: string;
  extractedEntityId: string;
  extractedLabel: string;
  fields: MergeComparisonField[];
  suggestedAliasLabel?: string | null;
  conflicts: string[];
};

type CanonicalSummary = {
  id?: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  meaning?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  startYear?: number | null;
  endYear?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  placeType?: unknown;
  notes?: string | null;
  sourceTraceNote?: string | null;
};

export type MergePreview = {
  willUpdate: { key: string; label: string; from: unknown; to: unknown }[];
  willNotChange: { key: string; label: string; reason: string }[];
  willAdd: { kind: string; detail: string }[];
  potentialConflicts: string[];
};

function asObj(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : null;
}

function extractedLabel(entity: ExtractedEntity): string {
  return (
    (entity.proposedTitle?.trim() ||
      entity.proposedName?.trim() ||
      str(asObj(entity.proposedData).title) ||
      str(asObj(entity.proposedData).name) ||
      str(asObj(entity.proposedData).label) ||
      "Extracted entity") as string
  );
}

function appendTrace(prev: string | null | undefined, note: string): string {
  const p = (prev ?? "").trim();
  if (!p.length) return note;
  if (p.includes(note)) return p;
  return `${p}\n\n${note}`;
}

export function buildMergeComparison(params: {
  extracted: ExtractedEntity;
  canonicalType: string;
  canonical: CanonicalSummary | null;
}): MergeComparison {
  const extracted = params.extracted;
  const d = asObj(extracted.proposedData);
  const extractedLbl = extractedLabel(extracted);
  const conflicts: string[] = [];

  const canonicalType = params.canonicalType;
  const canonical = params.canonical ?? {};

  const fields: MergeComparisonField[] = [];

  const add = (f: MergeComparisonField) => fields.push(f);

  const aliasCandidate =
    canonicalType === "person" || canonicalType === "place" || canonicalType === "event" || canonicalType === "symbol" || canonicalType === "chapter"
      ? extractedLbl
      : null;

  switch (canonicalType) {
    case "person": {
      add({
        key: "name",
        label: "Name",
        canonicalValue: canonical?.name ?? null,
        extractedValue: str(d.name) ?? extracted.proposedName ?? null,
        recommended: "keep_canonical",
        notes: "Prefer canonical name; store variants as an alias if needed.",
      });
      add({
        key: "description",
        label: "Description",
        canonicalValue: canonical?.description ?? null,
        extractedValue: str(d.description) ?? str(d.summary),
        recommended: canonical?.description ? "keep_canonical" : "use_extracted",
      });
      const eb = num(d.birthYear);
      const cb = canonical?.birthYear ?? null;
      const ed = num(d.deathYear);
      const cd = canonical?.deathYear ?? null;
      const birthConflict = eb !== null && cb !== null && eb !== cb;
      const deathConflict = ed !== null && cd !== null && ed !== cd;
      if (birthConflict) conflicts.push("birthYear_conflict");
      if (deathConflict) conflicts.push("deathYear_conflict");
      add({
        key: "birthYear",
        label: "Birth year",
        canonicalValue: cb,
        extractedValue: eb,
        recommended: cb == null ? "use_extracted" : birthConflict ? "append_note" : "keep_canonical",
        conflict: birthConflict,
        notes: birthConflict ? "Conflict detected; do not overwrite. Add a trace note / question." : undefined,
      });
      add({
        key: "deathYear",
        label: "Death year",
        canonicalValue: cd,
        extractedValue: ed,
        recommended: cd == null ? "use_extracted" : deathConflict ? "append_note" : "keep_canonical",
        conflict: deathConflict,
        notes: deathConflict ? "Conflict detected; do not overwrite. Add a trace note / question." : undefined,
      });
      break;
    }
    case "place": {
      add({
        key: "name",
        label: "Name",
        canonicalValue: canonical?.name ?? null,
        extractedValue: str(d.name) ?? extracted.proposedName ?? null,
        recommended: "keep_canonical",
        notes: "Prefer canonical name; store variants as an alias if needed.",
      });
      add({
        key: "description",
        label: "Description",
        canonicalValue: canonical?.description ?? null,
        extractedValue: str(d.description) ?? str(d.summary),
        recommended: canonical?.description ? "keep_canonical" : "use_extracted",
      });
      add({
        key: "latitude",
        label: "Latitude",
        canonicalValue: canonical?.latitude ?? null,
        extractedValue: num(d.latitude),
        recommended: canonical?.latitude == null ? "use_extracted" : "keep_canonical",
      });
      add({
        key: "longitude",
        label: "Longitude",
        canonicalValue: canonical?.longitude ?? null,
        extractedValue: num(d.longitude),
        recommended: canonical?.longitude == null ? "use_extracted" : "keep_canonical",
      });
      if (str(d.placeTypeSuggestion) && canonical?.placeType && str(d.placeTypeSuggestion) !== String(canonical.placeType)) {
        conflicts.push("placeType_conflict");
        add({
          key: "placeType",
          label: "Place type",
          canonicalValue: canonical.placeType,
          extractedValue: str(d.placeTypeSuggestion),
          recommended: "append_note",
          conflict: true,
          notes: "Potential type disagreement; do not overwrite automatically.",
        });
      }
      break;
    }
    case "event": {
      add({
        key: "title",
        label: "Title",
        canonicalValue: canonical?.title ?? null,
        extractedValue: str(d.title) ?? extracted.proposedTitle ?? null,
        recommended: canonical?.title ? "keep_canonical" : "use_extracted",
      });
      add({
        key: "description",
        label: "Description",
        canonicalValue: canonical?.description ?? null,
        extractedValue: str(d.description) ?? str(d.summary),
        recommended: canonical?.description ? "keep_canonical" : "use_extracted",
      });
      const es = num(d.startYear);
      const ee = num(d.endYear);
      const cs = canonical?.startYear ?? null;
      const ce = canonical?.endYear ?? null;
      const startConflict = es !== null && cs !== null && es !== cs;
      const endConflict = ee !== null && ce !== null && ee !== ce;
      if (startConflict || endConflict) conflicts.push("eventYear_conflict");
      add({
        key: "startYear",
        label: "Start year",
        canonicalValue: cs,
        extractedValue: es,
        recommended: cs == null ? "use_extracted" : startConflict ? "append_note" : "keep_canonical",
        conflict: startConflict,
      });
      add({
        key: "endYear",
        label: "End year",
        canonicalValue: ce,
        extractedValue: ee,
        recommended: ce == null ? "use_extracted" : endConflict ? "append_note" : "keep_canonical",
        conflict: endConflict,
      });
      break;
    }
    case "symbol": {
      add({
        key: "name",
        label: "Name",
        canonicalValue: canonical?.name ?? null,
        extractedValue: str(d.name) ?? extracted.proposedName ?? null,
        recommended: "keep_canonical",
      });
      add({
        key: "meaning",
        label: "Meaning",
        canonicalValue: canonical?.meaning ?? null,
        extractedValue: str(d.meaning) ?? str(d.summary) ?? str(d.description),
        recommended: canonical?.meaning ? "append_note" : "use_extracted",
        notes: canonical?.meaning ? "If the extracted meaning adds value, append via sourceTraceNote." : undefined,
      });
      break;
    }
    case "claim": {
      add({
        key: "description",
        label: "Description",
        canonicalValue: canonical?.description ?? null,
        extractedValue: str(d.description) ?? str(d.summary) ?? extracted.proposedTitle ?? extracted.proposedName ?? null,
        recommended: "keep_canonical",
        notes: "Claims are usually better created new; use link-only unless this is a clear duplicate.",
      });
      break;
    }
    case "chapter": {
      add({
        key: "title",
        label: "Title",
        canonicalValue: canonical?.title ?? null,
        extractedValue: str(d.title) ?? extracted.proposedTitle ?? null,
        recommended: "keep_canonical",
      });
      add({
        key: "summary",
        label: "Summary",
        canonicalValue: canonical?.summary ?? null,
        extractedValue: str(d.summary) ?? str(d.description),
        recommended: canonical?.summary ? "append_note" : "use_extracted",
      });
      break;
    }
    case "question":
    case "openQuestion": {
      add({
        key: "title",
        label: "Title",
        canonicalValue: canonical?.title ?? null,
        extractedValue: str(d.title) ?? extracted.proposedTitle ?? null,
        recommended: "keep_canonical",
      });
      add({
        key: "description",
        label: "Description",
        canonicalValue: canonical?.description ?? null,
        extractedValue: str(d.description) ?? str(d.summary),
        recommended: canonical?.description ? "append_note" : "use_extracted",
      });
      break;
    }
    case "continuity":
    case "continuityNote": {
      add({
        key: "title",
        label: "Title",
        canonicalValue: canonical?.title ?? null,
        extractedValue: str(d.title) ?? extracted.proposedTitle ?? null,
        recommended: "keep_canonical",
      });
      add({
        key: "description",
        label: "Description",
        canonicalValue: canonical?.description ?? null,
        extractedValue: str(d.description) ?? str(d.summary),
        recommended: canonical?.description ? "append_note" : "use_extracted",
      });
      break;
    }
    default:
      break;
  }

  const canonicalLabel =
    canonicalType === "event"
      ? (canonical?.title ?? "(untitled)")
      : canonicalType === "chapter"
        ? (canonical?.title ?? "(untitled)")
        : canonicalType === "question" || canonicalType === "openQuestion"
          ? (canonical?.title ?? "(untitled)")
          : canonicalType === "continuity" || canonicalType === "continuityNote"
            ? (canonical?.title ?? "(untitled)")
            : (canonical?.name ?? canonical?.description ?? "(untitled)");

  const suggestedAliasLabel =
    aliasCandidate && typeof aliasCandidate === "string" && aliasCandidate.trim().length
      ? aliasCandidate.trim()
      : null;

  return {
    canonicalType,
    canonicalId: String(canonical?.id ?? ""),
    canonicalLabel: String(canonicalLabel),
    extractedEntityId: extracted.id,
    extractedLabel: extractedLbl,
    fields,
    suggestedAliasLabel,
    conflicts,
  };
}

function normalizeForNameCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function bigramSet(s: string): Set<string> {
  const out = new Set<string>();
  const t = ` ${s} `;
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}

function nameSimilarity(a: string, b: string): number {
  const an = normalizeForNameCompare(a);
  const bn = normalizeForNameCompare(b);
  if (!an.length || !bn.length) return 0;
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.85;
  const A = bigramSet(an);
  const B = bigramSet(bn);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

export function buildMergePreview(params: {
  extractedEntityType: string;
  decision: "link_only" | "merge_conservative" | "promote_new";
  comparison?: MergeComparison;
  createAlias?: boolean;
}): MergePreview {
  const willUpdate: MergePreview["willUpdate"] = [];
  const willNotChange: MergePreview["willNotChange"] = [];
  const willAdd: MergePreview["willAdd"] = [];
  const potentialConflicts: string[] = [];

  if (params.decision === "promote_new") {
    willAdd.push({ kind: "canonical", detail: "Create a new canonical record (promote instead)" });
    willAdd.push({ kind: "link", detail: "Link extracted → canonical (promoted_new)" });
    return { willUpdate, willNotChange, willAdd, potentialConflicts };
  }

  const c = params.comparison;
  if (!c) {
    willNotChange.push({ key: "n/a", label: "Preview unavailable", reason: "Missing comparison" });
    return { willUpdate, willNotChange, willAdd, potentialConflicts };
  }

  if (params.extractedEntityType && params.extractedEntityType !== c.canonicalType) {
    potentialConflicts.push(
      `type_mismatch: extracted=${params.extractedEntityType} canonical=${c.canonicalType}`,
    );
  }

  const aliasLabel = c.suggestedAliasLabel?.trim();
  const nameSigDiff =
    aliasLabel && c.canonicalLabel
      ? nameSimilarity(aliasLabel, c.canonicalLabel) < 0.6
      : false;
  if (nameSigDiff) {
    potentialConflicts.push("name_significantly_differs");
  }
  for (const x of c.conflicts) potentialConflicts.push(x);

  if (params.decision === "link_only") {
    willAdd.push({ kind: "link", detail: "Link extracted → canonical (no data changes)" });
    if (params.createAlias && aliasLabel && normalizeForNameCompare(aliasLabel) !== normalizeForNameCompare(c.canonicalLabel)) {
      willAdd.push({ kind: "alias", detail: `alias: "${aliasLabel}"` });
    }
    willNotChange.push({ key: "data", label: "Canonical fields", reason: "Link-only decision" });
    return { willUpdate, willNotChange, willAdd, potentialConflicts };
  }

  // Conservative merge: only fill empties; never overwrite.
  for (const f of c.fields) {
    if (f.recommended === "use_extracted") {
      const from = f.canonicalValue ?? null;
      const to = f.extractedValue ?? null;
      if (isEmpty(from) && !isEmpty(to)) {
        willUpdate.push({ key: f.key, label: f.label, from, to });
      } else {
        willNotChange.push({
          key: f.key,
          label: f.label,
          reason: "Canonical already has a value (conservative merge does not overwrite)",
        });
      }
      continue;
    }
    if (f.recommended === "append_note") {
      willAdd.push({
        kind: "trace_note",
        detail: `Append trace note about ${f.label}`,
      });
      continue;
    }
    willNotChange.push({ key: f.key, label: f.label, reason: "Keep canonical" });
  }

  willAdd.push({ kind: "link", detail: "Link extracted → canonical (merged_into_existing)" });
  if (params.createAlias && aliasLabel && normalizeForNameCompare(aliasLabel) !== normalizeForNameCompare(c.canonicalLabel)) {
    willAdd.push({ kind: "alias", detail: `alias: "${aliasLabel}"` });
  }

  return { willUpdate, willNotChange, willAdd, potentialConflicts };
}

async function createAliasIfUseful(params: {
  canonicalType: string;
  canonicalId: string;
  extractedLabel: string;
  notes?: string | null;
}) {
  if (!["person", "place", "event", "symbol", "chapter"].includes(params.canonicalType)) return;
  const label = params.extractedLabel.trim();
  if (!label.length) return;
  await prisma.alias.create({
    data: {
      label,
      aliasType: "alternate_name",
      entityType: params.canonicalType,
      entityId: params.canonicalId,
      notes: params.notes ?? null,
    },
  });
}

export async function linkExtractedToCanonicalWithoutMerge(params: {
  extractedEntityId: string;
  canonicalType: string;
  canonicalId: string;
  notes?: string | null;
  confidence?: number | null;
  reviewedByNote?: string | null;
  createAlias?: boolean;
}) {
  const extracted = await prisma.extractedEntity.findUnique({
    where: { id: params.extractedEntityId },
  });
  if (!extracted) return { ok: false as const, reason: "not_found" };

  await prisma.entityLink.create({
    data: {
      extractedEntityId: extracted.id,
      canonicalEntityType: params.canonicalType,
      canonicalEntityId: params.canonicalId,
      linkType: "linked_only",
      confidence: params.confidence ?? extracted.confidence ?? null,
      notes: params.notes ?? null,
    },
  });

  if (params.createAlias) {
    await createAliasIfUseful({
      canonicalType: params.canonicalType,
      canonicalId: params.canonicalId,
      extractedLabel: extractedLabel(extracted),
      notes: params.notes ?? null,
    });
  }

  await prisma.extractedEntity.update({
    where: { id: extracted.id },
    data: {
      reviewStatus: "merged",
      matchMethod: "manual_selected",
      mergeDecision: "linked_only",
      mergeSnapshot: {
        action: "link_only",
        canonicalType: params.canonicalType,
        canonicalId: params.canonicalId,
        createAlias: Boolean(params.createAlias),
      },
      reviewedByNote: params.reviewedByNote ?? null,
      canonicalRecordType: params.canonicalType,
      canonicalRecordId: params.canonicalId,
      matchedRecordType: params.canonicalType,
      matchedRecordId: params.canonicalId,
    },
  });

  return { ok: true as const };
}

export async function mergeExtractedIntoCanonical(params: {
  extractedEntityId: string;
  canonicalType: string;
  canonicalId: string;
  reviewedByNote?: string | null;
  notes?: string | null;
  createAlias?: boolean;
  allowCreateContinuityHelpers?: boolean;
}) {
  const extracted = await prisma.extractedEntity.findUnique({
    where: { id: params.extractedEntityId },
  });
  if (!extracted) return { ok: false as const, reason: "not_found" };

  const canonical = await (async () => {
    switch (params.canonicalType) {
      case "person":
        return await prisma.person.findUnique({ where: { id: params.canonicalId } });
      case "place":
        return await prisma.place.findUnique({ where: { id: params.canonicalId } });
      case "event":
        return await prisma.event.findUnique({ where: { id: params.canonicalId } });
      case "symbol":
        return await prisma.symbol.findUnique({ where: { id: params.canonicalId } });
      case "claim":
        return await prisma.claim.findUnique({ where: { id: params.canonicalId } });
      case "chapter":
        return await prisma.chapter.findUnique({ where: { id: params.canonicalId } });
      case "question":
      case "openQuestion":
        return await prisma.openQuestion.findUnique({ where: { id: params.canonicalId } });
      case "continuity":
      case "continuityNote":
        return await prisma.continuityNote.findUnique({ where: { id: params.canonicalId } });
      default:
        return null;
    }
  })();
  if (!canonical) return { ok: false as const, reason: "canonical_not_found" };

  const comparison = buildMergeComparison({
    extracted,
    canonicalType: params.canonicalType,
    canonical,
  });

  const trace = `Merged from extracted entity ${extracted.id} (source ${extracted.sourceId}).${params.notes ? ` ${params.notes}` : ""}`;

  const canonicalUpdates: Record<string, unknown> = {};
  const noteUpdates: string[] = [];

  for (const f of comparison.fields) {
    if (f.recommended === "use_extracted") {
      canonicalUpdates[f.key] = f.extractedValue ?? null;
    }
    if (f.recommended === "append_note" && f.extractedValue != null) {
      noteUpdates.push(`${f.label}: extracted=${JSON.stringify(f.extractedValue)}`);
    }
  }

  // Apply conservative, type-specific updates.
  if (params.canonicalType === "person") {
    await prisma.person.update({
      where: { id: params.canonicalId },
      data: {
        description:
          canonicalUpdates.description !== undefined
            ? (canonicalUpdates.description as string | null)
            : undefined,
        birthYear:
          canonicalUpdates.birthYear !== undefined
            ? (canonicalUpdates.birthYear as number | null)
            : undefined,
        deathYear:
          canonicalUpdates.deathYear !== undefined
            ? (canonicalUpdates.deathYear as number | null)
            : undefined,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "place") {
    await prisma.place.update({
      where: { id: params.canonicalId },
      data: {
        description:
          canonicalUpdates.description !== undefined
            ? (canonicalUpdates.description as string | null)
            : undefined,
        latitude:
          canonicalUpdates.latitude !== undefined
            ? (canonicalUpdates.latitude as number | null)
            : undefined,
        longitude:
          canonicalUpdates.longitude !== undefined
            ? (canonicalUpdates.longitude as number | null)
            : undefined,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "event") {
    await prisma.event.update({
      where: { id: params.canonicalId },
      data: {
        description:
          canonicalUpdates.description !== undefined
            ? (canonicalUpdates.description as string | null)
            : undefined,
        startYear:
          canonicalUpdates.startYear !== undefined
            ? (canonicalUpdates.startYear as number | null)
            : undefined,
        endYear:
          canonicalUpdates.endYear !== undefined
            ? (canonicalUpdates.endYear as number | null)
            : undefined,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "symbol") {
    const meaning =
      canonicalUpdates.meaning !== undefined
        ? (canonicalUpdates.meaning as string | null)
        : undefined;
    await prisma.symbol.update({
      where: { id: params.canonicalId },
      data: {
        meaning,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "chapter") {
    await prisma.chapter.update({
      where: { id: params.canonicalId },
      data: {
        summary:
          canonicalUpdates.summary !== undefined
            ? (canonicalUpdates.summary as string | null)
            : undefined,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "openQuestion" || params.canonicalType === "question") {
    await prisma.openQuestion.update({
      where: { id: params.canonicalId },
      data: {
        description:
          canonicalUpdates.description !== undefined
            ? (canonicalUpdates.description as string | null)
            : undefined,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "continuityNote" || params.canonicalType === "continuity") {
    await prisma.continuityNote.update({
      where: { id: params.canonicalId },
      data: {
        description:
          canonicalUpdates.description !== undefined
            ? (canonicalUpdates.description as string | null)
            : undefined,
        sourceTraceNote: appendTrace(
          (canonical as { sourceTraceNote?: string | null }).sourceTraceNote,
          noteUpdates.length ? `${trace}\n${noteUpdates.join("\n")}` : trace,
        ),
      },
    });
  } else if (params.canonicalType === "claim") {
    // Intentionally conservative: do not overwrite claims.
    // Keep as link + trace note only.
    await prisma.claim.update({
      where: { id: params.canonicalId },
      data: {
        notes: appendTrace((canonical as { notes?: string | null }).notes, trace),
      },
    });
  }

  if (params.createAlias) {
    await createAliasIfUseful({
      canonicalType: params.canonicalType,
      canonicalId: params.canonicalId,
      extractedLabel: extractedLabel(extracted),
      notes: params.notes ?? null,
    });
  }

  await prisma.entityLink.create({
    data: {
      extractedEntityId: extracted.id,
      canonicalEntityType: params.canonicalType,
      canonicalEntityId: params.canonicalId,
      linkType: "merged_into",
      confidence: extracted.confidence ?? null,
      notes: params.notes ?? null,
    },
  });

  await prisma.extractedEntity.update({
    where: { id: extracted.id },
    data: {
      reviewStatus: "merged",
      matchMethod: "manual_selected",
      mergeDecision: "merged_into_existing",
      mergeSnapshot: {
        action: "merge_conservative",
        canonicalType: params.canonicalType,
        canonicalId: params.canonicalId,
        createAlias: Boolean(params.createAlias),
        applied: canonicalUpdates as unknown as Prisma.JsonObject,
        notesAppended: noteUpdates,
        conflicts: comparison.conflicts,
      },
      reviewedByNote: params.reviewedByNote ?? null,
      canonicalRecordType: params.canonicalType,
      canonicalRecordId: params.canonicalId,
      matchedRecordType: params.canonicalType,
      matchedRecordId: params.canonicalId,
    },
  });

  // Optional continuity tie-in (very lightweight): only for clear conflicts.
  if (params.allowCreateContinuityHelpers && comparison.conflicts.length) {
    await prisma.openQuestion.create({
      data: {
        title: `Merge conflict: ${params.canonicalType} ${params.canonicalId}`,
        description: `Conflicts detected while merging extracted entity ${extracted.id}.\n\nConflicts: ${comparison.conflicts.join(", ")}\n\nReview notes: ${params.notes ?? "(none)"}`,
        status: "open",
        priority: 3,
        linkedSourceId: extracted.sourceId,
      },
    });
  }

  return { ok: true as const, comparison };
}

export async function promoteExtractedAsNewCanonical(params: {
  extractedEntityId: string;
  reviewedByNote?: string | null;
  notes?: string | null;
}) {
  const extracted = await prisma.extractedEntity.findUnique({
    where: { id: params.extractedEntityId },
  });
  if (!extracted) return { ok: false as const, reason: "not_found" };

  const promoted = await promoteExtractedByType(extracted);
  if (!promoted.ok) return promoted;

  await prisma.entityLink.create({
    data: {
      extractedEntityId: extracted.id,
      canonicalEntityType: promoted.recordType,
      canonicalEntityId: promoted.recordId,
      linkType: "promoted_new",
      confidence: extracted.confidence ?? null,
      notes: params.notes ?? null,
    },
  });

  await prisma.extractedEntity.update({
    where: { id: extracted.id },
    data: {
      matchMethod: "promoted_new",
      mergeDecision: "promoted_new",
      mergeSnapshot: {
        action: "promote_new",
        canonicalType: promoted.recordType,
        canonicalId: promoted.recordId,
      },
      reviewedByNote: params.reviewedByNote ?? null,
      canonicalRecordType: promoted.recordType,
      canonicalRecordId: promoted.recordId,
    },
  });

  return promoted;
}

