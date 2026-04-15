import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  advanceDraftLifecycle,
  createDraftRevisionProgram,
} from "@/lib/services/drafting-revision-program-service";

describe("drafting-revision-program-service", () => {
  it("supports draft to revision lifecycle with lineage records", () => {
    const draft = createDraftRevisionProgram({
      chapterId: "chapter-4",
      currentVersionId: "v1",
    });
    const revised = advanceDraftLifecycle({
      program: draft,
      nextStage: "revision",
      revision: {
        revisionId: "r1",
        previousVersionId: "v1",
        changeJustification: "resolved transition burden from prior chapter",
        continuityRepairMarkers: ["carryover-thread-y"],
      },
    });
    assert.equal(revised.stage, "revision");
    assert.equal(revised.revisions.length, 1);
  });

  it("blocks candidate transition when structural violations remain", () => {
    const draft = createDraftRevisionProgram({
      chapterId: "chapter-4",
      currentVersionId: "v1",
      quality: {
        unresolvedStructuralViolations: ["missing transition closure"],
        arcMisalignment: [],
        continuityBreaks: [],
      },
    });
    const revision = advanceDraftLifecycle({
      program: draft,
      nextStage: "revision",
    });
    assert.throws(() =>
      advanceDraftLifecycle({
        program: revision,
        nextStage: "candidate",
      })
    );
  });
});
