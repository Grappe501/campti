import {
  CONTENT_RELEASE_CONTRACT_VERSION,
  type ContentVersionState,
  type StoryContentVersion,
  type StoryReleaseLedger,
} from "@/lib/domain/content-release-version";

function normalizeVersion(input: StoryContentVersion): StoryContentVersion {
  return {
    ...input,
    versionId: input.versionId.trim(),
    storyId: input.storyId.trim(),
  };
}

export function createReleaseLedger(storyId: string): StoryReleaseLedger {
  const normalizedStoryId = storyId.trim();
  if (!normalizedStoryId) {
    throw new Error("[release-governance] storyId is required.");
  }
  return {
    contractVersion: CONTENT_RELEASE_CONTRACT_VERSION,
    storyId: normalizedStoryId,
    versions: [],
  };
}

export function registerStoryVersion(input: {
  ledger: StoryReleaseLedger;
  versionId: string;
  state?: ContentVersionState;
  createdAtIso?: string;
}): StoryReleaseLedger {
  const versionId = input.versionId.trim();
  if (!versionId) {
    throw new Error("[release-governance] versionId is required.");
  }
  if (input.ledger.versions.some((version) => version.versionId === versionId)) {
    throw new Error(`[release-governance] version ${versionId} already exists.`);
  }

  const version = normalizeVersion({
    versionId,
    storyId: input.ledger.storyId,
    state: input.state ?? "draft",
    createdAtIso: input.createdAtIso ?? new Date().toISOString(),
  });

  return {
    ...input.ledger,
    versions: [...input.ledger.versions, version],
  };
}

export function transitionStoryVersionState(input: {
  ledger: StoryReleaseLedger;
  versionId: string;
  targetState: ContentVersionState;
}): StoryReleaseLedger {
  const versionId = input.versionId.trim();
  if (!input.ledger.versions.some((version) => version.versionId === versionId)) {
    throw new Error(`[release-governance] version ${versionId} not found.`);
  }

  let publishedFound = false;
  const versions = input.ledger.versions.map((version) => {
    if (version.versionId === versionId) {
      if (input.targetState === "published") {
        publishedFound = true;
      }
      return { ...version, state: input.targetState };
    }
    if (input.targetState === "published" && version.state === "published") {
      // Keep single active published version by archiving prior published revisions.
      return { ...version, state: "archived" as const };
    }
    return version;
  });

  if (input.targetState === "published" && !publishedFound) {
    throw new Error(`[release-governance] publish transition failed for version ${versionId}.`);
  }

  return {
    ...input.ledger,
    versions,
  };
}

export function resolveReaderConsumableVersion(input: {
  ledger: StoryReleaseLedger;
  allowCandidate?: boolean;
}): StoryContentVersion {
  const published = input.ledger.versions.find((version) => version.state === "published");
  if (published) {
    return published;
  }
  if (input.allowCandidate) {
    const candidate = input.ledger.versions.find((version) => version.state === "candidate");
    if (candidate) {
      return candidate;
    }
  }
  throw new Error("[release-governance] no consumable version available for reader.");
}
