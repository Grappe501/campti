import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  allocateSessionScope,
  listReaderActiveSessions,
} from "@/lib/services/multi-session-isolation-service";

describe("multi-session-isolation-service", () => {
  it("allocates an isolated session scope", () => {
    const scope = allocateSessionScope({
      sessionId: "session-1",
      readerId: "reader-1",
      storyId: "story-1",
      existingScopes: [],
      startedAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.equal(scope.state, "active");
    assert.equal(scope.storyId, "story-1");
  });

  it("rejects session bleeding across reader/story boundaries", () => {
    const existing = [
      allocateSessionScope({
        sessionId: "session-1",
        readerId: "reader-1",
        storyId: "story-1",
        existingScopes: [],
        startedAtIso: "2026-04-15T00:00:00.000Z",
      }),
    ];
    assert.throws(() =>
      allocateSessionScope({
        sessionId: "session-1",
        readerId: "reader-2",
        storyId: "story-2",
        existingScopes: existing,
      })
    );
  });

  it("lists active sessions per user without leakage", () => {
    const readerOne = allocateSessionScope({
      sessionId: "session-1",
      readerId: "reader-1",
      storyId: "story-1",
      existingScopes: [],
    });
    const readerTwo = allocateSessionScope({
      sessionId: "session-2",
      readerId: "reader-2",
      storyId: "story-9",
      existingScopes: [readerOne],
    });
    const listed = listReaderActiveSessions({
      readerId: "reader-1",
      scopes: [readerOne, readerTwo],
    });
    assert.deepEqual(
      listed.map((scope) => scope.sessionId),
      ["session-1"]
    );
  });
});
