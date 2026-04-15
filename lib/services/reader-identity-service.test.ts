import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertReaderIdentityIsolation,
  createReaderIdentity,
  linkReaderIdentitySession,
} from "@/lib/services/reader-identity-service";

describe("reader-identity-service", () => {
  it("creates a persistent reader identity with defaults", () => {
    const identity = createReaderIdentity({
      userId: "reader-1",
      accountMetadata: {
        tier: "free",
        locale: "en-US",
        createdAtIso: "2026-04-15T00:00:00.000Z",
      },
    });
    assert.equal(identity.preferences.pacing, "balanced");
    assert.equal(identity.libraryState.pinnedStoryIds.length, 0);
  });

  it("rejects cross-user identity access", () => {
    assert.throws(() =>
      assertReaderIdentityIsolation({
        requestingUserId: "reader-a",
        targetUserId: "reader-b",
        operation: "continuity_read",
      })
    );
  });

  it("links sessions only for matching identity owner", () => {
    const identity = createReaderIdentity({
      userId: "reader-1",
      accountMetadata: {
        tier: "premium",
        locale: "en-US",
        createdAtIso: "2026-04-15T00:00:00.000Z",
      },
    });
    const link = linkReaderIdentitySession({
      identity,
      sessionId: "session-1",
      sessionOwnerUserId: "reader-1",
    });
    assert.equal(link.sessionId, "session-1");
  });
});
