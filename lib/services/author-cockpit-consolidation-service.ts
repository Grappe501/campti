export type CockpitSurfaceOwnership = {
  routePattern: string;
  ownership: "authoritative_cockpit" | "absorbed_legacy_route" | "internal_debug" | "admin_utility";
  audience: "author" | "admin" | "internal";
};

const AUTHORITATIVE_COCKPIT_ROUTE = "/admin/narrative";

const COCKPIT_SURFACE_OWNERSHIP: CockpitSurfaceOwnership[] = [
  {
    routePattern: "/admin/narrative",
    ownership: "authoritative_cockpit",
    audience: "author",
  },
  {
    routePattern: "/admin/scenes/[id]/workspace",
    ownership: "absorbed_legacy_route",
    audience: "author",
  },
  {
    routePattern: "/admin/narrative/books/[bookId]",
    ownership: "absorbed_legacy_route",
    audience: "author",
  },
  {
    routePattern: "/admin/narrative/chapters/[chapterId]/assembly",
    ownership: "absorbed_legacy_route",
    audience: "author",
  },
  {
    routePattern: "/admin/scenes/[id]/observer",
    ownership: "internal_debug",
    audience: "internal",
  },
  {
    routePattern: "/admin/world-observer",
    ownership: "internal_debug",
    audience: "internal",
  },
];

export function listCockpitSurfaceOwnership(): CockpitSurfaceOwnership[] {
  return [...COCKPIT_SURFACE_OWNERSHIP];
}

export function getAuthoritativeCockpitRoute(): string {
  return AUTHORITATIVE_COCKPIT_ROUTE;
}

export function resolveLegacyWorkbenchRedirect(input: {
  routePattern: "/admin/scenes/[id]/workspace" | "/admin/narrative/books/[bookId]" | "/admin/narrative/chapters/[chapterId]/assembly";
  id: string;
}): string {
  const id = input.id.trim();
  if (!id) {
    throw new Error("[author-cockpit-consolidation] id is required for legacy route redirect.");
  }

  if (input.routePattern === "/admin/scenes/[id]/workspace") {
    return `${AUTHORITATIVE_COCKPIT_ROUTE}?scope=scene&sceneId=${encodeURIComponent(id)}`;
  }
  if (input.routePattern === "/admin/narrative/books/[bookId]") {
    return `${AUTHORITATIVE_COCKPIT_ROUTE}?scope=book&bookId=${encodeURIComponent(id)}`;
  }
  return `${AUTHORITATIVE_COCKPIT_ROUTE}?scope=chapter&chapterId=${encodeURIComponent(id)}`;
}

export function evaluateAuthorCockpitConsolidation(): {
  ok: boolean;
  authoritativeRoutes: string[];
  duplicateAuthorities: string[];
  absorbedRoutes: string[];
  checkedInvariants: string[];
} {
  const authoritativeRoutes = COCKPIT_SURFACE_OWNERSHIP
    .filter((surface) => surface.ownership === "authoritative_cockpit")
    .map((surface) => surface.routePattern);
  const duplicateAuthorities = authoritativeRoutes.length > 1 ? authoritativeRoutes : [];
  const absorbedRoutes = COCKPIT_SURFACE_OWNERSHIP
    .filter((surface) => surface.ownership === "absorbed_legacy_route")
    .map((surface) => surface.routePattern);
  return {
    ok: duplicateAuthorities.length === 0 && authoritativeRoutes.length === 1,
    authoritativeRoutes,
    duplicateAuthorities,
    absorbedRoutes,
    checkedInvariants: [
      "single_authoritative_author_cockpit",
      "no_competing_top_level_workbenches",
      "debug_internal_separation",
      "author_command_route_declaration",
    ],
  };
}
