import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createReleaseLedger,
  registerStoryVersion,
  resolveReaderConsumableVersion,
  transitionStoryVersionState,
} from "@/lib/services/release-governance-service";

describe("release-governance-service", () => {
  it("prevents draft versions from leaking to reader consumption", () => {
    const ledger = registerStoryVersion({
      ledger: createReleaseLedger("story-1"),
      versionId: "v1",
      state: "draft",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.throws(() => resolveReaderConsumableVersion({ ledger }));
  });

  it("promotes candidate to published for reader consumption", () => {
    const withCandidate = registerStoryVersion({
      ledger: createReleaseLedger("story-1"),
      versionId: "v2",
      state: "candidate",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const published = transitionStoryVersionState({
      ledger: withCandidate,
      versionId: "v2",
      targetState: "published",
    });
    assert.equal(resolveReaderConsumableVersion({ ledger: published }).versionId, "v2");
  });

  it("archives prior published versions on publish transition", () => {
    let ledger = createReleaseLedger("story-1");
    ledger = registerStoryVersion({
      ledger,
      versionId: "v1",
      state: "published",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    ledger = registerStoryVersion({
      ledger,
      versionId: "v2",
      state: "candidate",
      createdAtIso: "2026-04-16T00:00:00.000Z",
    });
    ledger = transitionStoryVersionState({
      ledger,
      versionId: "v2",
      targetState: "published",
    });

    assert.equal(ledger.versions.find((version) => version.versionId === "v1")?.state, "archived");
    assert.equal(ledger.versions.find((version) => version.versionId === "v2")?.state, "published");
  });
});
