/**
 * Preserve Stage 8 evaluation context (`ws`, `focal`, `debug`) when navigating
 * or POSTing from the scene workspace.
 */
export type WorkspaceStickySearch = {
  ws?: string;
  focal?: string;
  debug?: string;
};

/** Build a query string like `?ws=…&focal=…&debug=1` (empty when nothing to carry). */
export function serializeWorkspaceStickyQuery(sp: WorkspaceStickySearch): string {
  const p = new URLSearchParams();
  if (sp.ws !== undefined && sp.ws !== "") p.set("ws", sp.ws);
  if (sp.focal !== undefined && sp.focal !== "") p.set("focal", sp.focal);
  if ((sp.debug ?? "").trim() === "1") p.set("debug", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Append sticky query to a path that may already have search params. */
export function withWorkspaceSticky(path: string, sticky: WorkspaceStickySearch): string {
  const q = serializeWorkspaceStickyQuery(sticky);
  if (!q) return path;
  return path.includes("?") ? `${path}&${q.slice(1)}` : `${path}${q}`;
}
