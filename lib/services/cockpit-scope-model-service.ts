import type { AuthorCockpitScope, CockpitScopeContext } from "@/lib/domain/author-command-cockpit";

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveCockpitScopeContext(input: {
  scope?: string;
  sceneId?: string;
  chapterId?: string;
  bookId?: string;
  epicId?: string;
}): CockpitScopeContext {
  const scope = (input.scope?.trim() as AuthorCockpitScope | undefined) ?? "scene";
  if (!["scene", "chapter", "book", "epic"].includes(scope)) {
    throw new Error(`[cockpit-scope-model] unsupported scope ${input.scope ?? "undefined"}.`);
  }

  const sceneId = nonEmpty(input.sceneId);
  const chapterId = nonEmpty(input.chapterId);
  const bookId = nonEmpty(input.bookId);
  const epicId = nonEmpty(input.epicId);

  if (scope === "scene" && !sceneId) {
    throw new Error("[cockpit-scope-model] scene scope requires sceneId.");
  }
  if (scope === "chapter" && !chapterId) {
    throw new Error("[cockpit-scope-model] chapter scope requires chapterId.");
  }
  if (scope === "book" && !bookId) {
    throw new Error("[cockpit-scope-model] book scope requires bookId.");
  }
  if (scope === "epic" && !epicId) {
    throw new Error("[cockpit-scope-model] epic scope requires epicId.");
  }

  return {
    scope,
    sceneId,
    chapterId,
    bookId,
    epicId,
  };
}

export function listAvailableScopeEscalations(scope: AuthorCockpitScope): AuthorCockpitScope[] {
  if (scope === "scene") return ["chapter", "book", "epic"];
  if (scope === "chapter") return ["book", "epic"];
  if (scope === "book") return ["epic"];
  return [];
}
