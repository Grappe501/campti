/**
 * P2-X interaction session orchestration (integration, optional DB).
 * Run: npx tsx --test lib/services/interaction-session-orchestration-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import { readConversationAnchorFromMetadata } from "@/lib/services/conversation-anchor-service";
import {
  endInteractivePauseSession,
  getInteractiveOrchestrationState,
  pauseNarrativeForConversation,
  resumeNarrativeAfterConversation,
  startInteractivePauseSession,
} from "@/lib/services/interaction-session-orchestration-service";

const READER = "p2x-orchestration-test-reader";

describe("interaction-session-orchestration-service (integration)", () => {
  let enabled = false;
  let characterId = "";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      const p = await prisma.person.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (!p) return;
      characterId = p.id;
      try {
        await prisma.readerInteractionLedgerEntry.deleteMany({ where: { readerId: READER } });
      } catch {
        /* table may not exist until migration */
      }
      await prisma.characterConversationSession.deleteMany({ where: { readerId: READER } });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.readerInteractionLedgerEntry.deleteMany({ where: { readerId: READER } });
      await prisma.characterConversationSession.deleteMany({ where: { readerId: READER } });
    } catch {
      /* best-effort */
    }
  });

  it("start → pause → resume → end updates orchestration flags and session status", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }

    const started = await startInteractivePauseSession({
      characterId,
      readerId: READER,
      sceneId: null,
      narrativeAnchor: { label: "chapter-3" },
    });
    assert.equal(started.session.status, "ACTIVE");
    assert.equal(started.orchestration.narrativePaused, false);
    assert.ok(started.orchestration.narrativeResumeToken.startsWith("resume:"));
    const anchor = readConversationAnchorFromMetadata(started.session.metadataJson);
    assert.ok(anchor);
    assert.ok(typeof anchor!.initialIdentityHash === "string");
    assert.ok(typeof anchor!.initialKnowledgeSummaryHash === "string");

    const paused = await pauseNarrativeForConversation({
      sessionId: started.session.id,
      characterId,
      readerId: READER,
    });
    assert.equal(paused.orchestration.narrativePaused, true);
    assert.equal(paused.orchestration.conversationActive, true);
    assert.ok(paused.orchestration.narrativePausedAtIso);

    const idem = await pauseNarrativeForConversation({
      sessionId: started.session.id,
      characterId,
      readerId: READER,
    });
    assert.equal(idem.orchestration.narrativePaused, true);

    const resumed = await resumeNarrativeAfterConversation({
      sessionId: started.session.id,
      characterId,
      readerId: READER,
    });
    assert.equal(resumed.orchestration.narrativePaused, false);
    assert.equal(resumed.orchestration.conversationActive, false);
    assert.ok(resumed.orchestration.narrativeResumedAtIso);

    assert.throws(
      () =>
        resumeNarrativeAfterConversation({
          sessionId: started.session.id,
          characterId,
          readerId: READER,
        }),
      /narrativePaused/
    );

    const ended = await endInteractivePauseSession({
      sessionId: started.session.id,
      characterId,
      readerId: READER,
    });
    assert.equal(ended.session.status, "ENDED");
    assert.ok(ended.session.endedAt);
  });

  it("getInteractiveOrchestrationState reads persisted block", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    const s = await startInteractivePauseSession({
      characterId,
      readerId: READER,
    });
    const orch = getInteractiveOrchestrationState(s.session.metadataJson);
    assert.ok(orch);
    assert.equal(orch!.version, "1");
    await endInteractivePauseSession({
      sessionId: s.session.id,
      characterId,
      readerId: READER,
    });
  });
});
