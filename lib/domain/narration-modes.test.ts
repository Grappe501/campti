/**
 * P2-Z narration modes. Run: npx tsx --test lib/domain/narration-modes.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION,
  NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE,
  isBoundedCharacterConversationMode,
  isFutureAuthorGodModeLabel,
  requireBoundedCharacterConversationMode,
} from "@/lib/domain/narration-modes";

describe("narration-modes", () => {
  it("distinguishes bounded vs future author/God labels", () => {
    assert.equal(isBoundedCharacterConversationMode(NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION), true);
    assert.equal(isBoundedCharacterConversationMode(NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE), false);
    assert.equal(isFutureAuthorGodModeLabel(NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE), true);
    assert.equal(isFutureAuthorGodModeLabel(NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION), false);
  });

  it("requireBoundedCharacterConversationMode passes only for bounded mode", () => {
    requireBoundedCharacterConversationMode(NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION);
    assert.throws(
      () => requireBoundedCharacterConversationMode(NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE),
      /not implemented/
    );
  });
});
