/**
 * Derive canonical entity (type + id) from admin URL for agent context.
 */

export type AdminEntityRef = {
  /** Prisma-style snake_case model hint */
  type: string;
  id: string;
};

/**
 * Best-effort parse of /admin/... dynamic segments. Returns null on list-only pages.
 */
export function parseEntityFromAdminPath(pathname: string): AdminEntityRef | null {
  const p = pathname.replace(/\/$/, "") || "";
  const parts = p.split("/").filter(Boolean);
  if (parts[0] !== "admin") return null;

  // /admin/registries/:slug (master registry catalog — not a Prisma row)
  if (parts[1] === "registries" && parts[2]) {
    return { type: "master_registry", id: parts[2]! };
  }

  // /admin/characters/:id/mind
  if (parts[1] === "characters" && parts[3] === "mind" && parts[2]) {
    return { type: "person", id: parts[2]! };
  }

  // /admin/places/:id/environment
  if (parts[1] === "places" && parts[3] === "environment" && parts[2]) {
    return { type: "place", id: parts[2]! };
  }

  // /admin/meta-scenes/:id/(compose|cinematic|...)
  if (parts[1] === "meta-scenes" && parts[2]) {
    return { type: "meta_scene", id: parts[2]! };
  }

  // /admin/scenes/:id/(workspace|...)
  if (parts[1] === "scenes" && parts[2]) {
    return { type: "scene", id: parts[2]! };
  }

  // /admin/sources/:id/...
  if (parts[1] === "sources" && parts[2]) {
    return { type: "source", id: parts[2]! };
  }

  // /admin/ingestion/:sourceId
  if (parts[1] === "ingestion" && parts[2]) {
    return { type: "source", id: parts[2]! };
  }

  const areaToType: Record<string, string> = {
    fragments: "fragment",
    people: "person",
    places: "place",
    events: "event",
    chapters: "chapter",
    clusters: "fragment_cluster",
    claims: "claim",
    continuity: "continuity_note",
    questions: "open_question",
    relationships: "relationship",
    "narrative-rules": "narrative_rule",
    themes: "theme",
    motifs: "motif",
    symbols: "symbol",
    patterns: "narrative_pattern",
    "literary-devices": "literary_device",
    bindings: "narrative_binding",
    chunks: "source_chunk",
    extracted: "extracted_entity",
    runs: "ingestion_run",
    "audio-sync": "scene_audio_asset",
  };

  const t = parts[1] ? areaToType[parts[1]] : undefined;
  if (t && parts[2]) return { type: t, id: parts[2]! };

  return null;
}
