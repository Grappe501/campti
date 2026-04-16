import type { AuthorCommandCockpitBundle, AuthorCockpitScope } from "@/lib/domain/author-command-cockpit";

export function deriveCenteredSurfaceTitle(input: {
  scope: AuthorCockpitScope;
  sceneLabel?: string;
  chapterLabel?: string;
  bookLabel?: string;
  epicLabel?: string;
}): { title: string; subtitle: string } {
  if (input.scope === "scene") {
    return {
      title: input.sceneLabel ? `Scene · ${input.sceneLabel}` : "Scene",
      subtitle: "Focused draft, continuity, and interaction command view.",
    };
  }
  if (input.scope === "chapter") {
    return {
      title: input.chapterLabel ? `Chapter · ${input.chapterLabel}` : "Chapter",
      subtitle: "Progression, transitions, and assembly command view.",
    };
  }
  if (input.scope === "book") {
    return {
      title: input.bookLabel ? `Book · ${input.bookLabel}` : "Book",
      subtitle: "Arc balance, blockers, and release-readiness command view.",
    };
  }
  return {
    title: input.epicLabel ? `Epic · ${input.epicLabel}` : "Epic",
    subtitle: "Cross-book continuity and production command view.",
  };
}

export function assertCockpitShellArchitecture(bundle: AuthorCommandCockpitBundle): void {
  if (!bundle.centeredSurface.title.trim()) {
    throw new Error("[cockpit-shell-architecture] centered title is required.");
  }
  if (bundle.toolRails.leftRail.tools.length === 0 || bundle.toolRails.rightRail.tools.length === 0) {
    throw new Error("[cockpit-shell-architecture] left and right tool rails must be populated.");
  }
  if (bundle.toolRails.topBand.tools.length === 0) {
    throw new Error("[cockpit-shell-architecture] top band tools are required.");
  }
}
