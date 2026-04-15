export const MULTI_SESSION_SCOPE_CONTRACT_VERSION = "1" as const;

export type ReaderSessionScope = {
  contractVersion: typeof MULTI_SESSION_SCOPE_CONTRACT_VERSION;
  sessionId: string;
  readerId: string;
  storyId: string;
  startedAtIso: string;
  state: "active" | "paused" | "ended";
};
