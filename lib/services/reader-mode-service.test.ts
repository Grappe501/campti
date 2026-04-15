import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveReaderModeForSession,
  resolveReaderModePresentationProfile,
  toCanonicalReaderMode,
  toLegacyReaderLastMode,
} from "@/lib/services/reader-mode-service";

describe("reader-mode-service", () => {
  it("maps legacy values to canonical reader modes", () => {
    assert.equal(toCanonicalReaderMode("reading"), "read");
    assert.equal(toCanonicalReaderMode("immersive"), "feel");
    assert.equal(toCanonicalReaderMode("guided"), "guided");
    assert.equal(toCanonicalReaderMode("listen"), "listen");
  });

  it("maps canonical mode back to legacy persistence enum", () => {
    assert.equal(toLegacyReaderLastMode("read"), "reading");
    assert.equal(toLegacyReaderLastMode("feel"), "immersive");
  });

  it("uses requested mode first and stays presentation-only", () => {
    const mode = resolveReaderModeForSession({
      persistedMode: "reading",
      requestedMode: "listen",
    });
    const profile = resolveReaderModePresentationProfile(mode);
    assert.equal(profile.mode, "listen");
    assert.equal(profile.presentationOnly, true);
    assert.equal(profile.isAudioLed, true);
  });
});
