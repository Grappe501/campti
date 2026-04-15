import {
  READER_IDENTITY_CONTRACT_VERSION,
  type ReaderIdentity,
  type ReaderLibraryState,
  type ReaderPreferences,
} from "@/lib/domain/reader-identity";

function normalizeLibraryState(state?: Partial<ReaderLibraryState>): ReaderLibraryState {
  return {
    storyProgressByStoryId: state?.storyProgressByStoryId ?? {},
    pinnedStoryIds: [...new Set((state?.pinnedStoryIds ?? []).map((id) => id.trim()).filter(Boolean))],
  };
}

function normalizePreferences(preferences?: Partial<ReaderPreferences>): ReaderPreferences {
  return {
    pacing: preferences?.pacing ?? "balanced",
    presentationLanguageCode: preferences?.presentationLanguageCode?.trim() || "en",
    audioEnabled: preferences?.audioEnabled ?? true,
  };
}

export function createReaderIdentity(input: {
  userId: string;
  accountMetadata: ReaderIdentity["accountMetadata"];
  preferences?: Partial<ReaderPreferences>;
  libraryState?: Partial<ReaderLibraryState>;
}): ReaderIdentity {
  const userId = input.userId.trim();
  if (!userId) {
    throw new Error("[reader-identity] userId is required.");
  }

  return {
    contractVersion: READER_IDENTITY_CONTRACT_VERSION,
    userId,
    accountMetadata: input.accountMetadata,
    preferences: normalizePreferences(input.preferences),
    libraryState: normalizeLibraryState(input.libraryState),
  };
}

export function assertReaderIdentityIsolation(input: {
  requestingUserId: string;
  targetUserId: string;
  operation: "session_link" | "continuity_read" | "personalization_read";
}): void {
  const requestingUserId = input.requestingUserId.trim();
  const targetUserId = input.targetUserId.trim();
  if (!requestingUserId || !targetUserId) {
    throw new Error("[reader-identity] requestingUserId and targetUserId are required.");
  }
  if (requestingUserId !== targetUserId) {
    throw new Error(
      `[reader-identity] identity isolation violation on ${input.operation}: ${requestingUserId} cannot access ${targetUserId}.`
    );
  }
}

export function linkReaderIdentitySession(input: {
  identity: ReaderIdentity;
  sessionId: string;
  sessionOwnerUserId: string;
}): { userId: string; sessionId: string } {
  const sessionId = input.sessionId.trim();
  if (!sessionId) {
    throw new Error("[reader-identity] sessionId is required.");
  }
  assertReaderIdentityIsolation({
    requestingUserId: input.identity.userId,
    targetUserId: input.sessionOwnerUserId,
    operation: "session_link",
  });
  return {
    userId: input.identity.userId,
    sessionId,
  };
}
