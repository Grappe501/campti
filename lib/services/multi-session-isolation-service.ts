import {
  MULTI_SESSION_SCOPE_CONTRACT_VERSION,
  type ReaderSessionScope,
} from "@/lib/domain/multi-session-scope";

export function allocateSessionScope(input: {
  sessionId: string;
  readerId: string;
  storyId: string;
  existingScopes: ReaderSessionScope[];
  startedAtIso?: string;
}): ReaderSessionScope {
  const sessionId = input.sessionId.trim();
  const readerId = input.readerId.trim();
  const storyId = input.storyId.trim();
  if (!sessionId || !readerId || !storyId) {
    throw new Error("[multi-session] sessionId, readerId, and storyId are required.");
  }

  const existing = input.existingScopes.find((scope) => scope.sessionId === sessionId);
  if (existing && (existing.readerId !== readerId || existing.storyId !== storyId)) {
    throw new Error(
      `[multi-session] session isolation violation: ${sessionId} already belongs to ${existing.readerId}/${existing.storyId}.`
    );
  }

  return Object.freeze({
    contractVersion: MULTI_SESSION_SCOPE_CONTRACT_VERSION,
    sessionId,
    readerId,
    storyId,
    startedAtIso: input.startedAtIso ?? new Date().toISOString(),
    state: "active" as const,
  });
}

export function listReaderActiveSessions(input: {
  readerId: string;
  scopes: ReaderSessionScope[];
}): ReaderSessionScope[] {
  const readerId = input.readerId.trim();
  return input.scopes.filter((scope) => scope.readerId === readerId && scope.state !== "ended");
}
