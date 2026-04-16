import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { NarrativeThreadValidationService } from "@/lib/services/narrative-thread-validation-service";

describe("narrative-thread-validation-service", () => {
  it("validates sample thread pack schema and callback structure", () => {
    const pack = new NarrativeThreadDerivationService().buildBook1SampleThreadPack();
    const service = new NarrativeThreadValidationService();
    const result = service.validateThread(pack.threads[0]);
    assert.equal(result.passesAll, true);
    assert.equal(result.errors.length, 0);
  });

  it("rejects callback node without callback marker", () => {
    const pack = new NarrativeThreadDerivationService().buildBook1SampleThreadPack();
    const broken = {
      ...pack.threads[0],
      nodes: pack.threads[0].nodes.map((node, index) =>
        index === 0
          ? {
              ...node,
              nodeType: "callback" as const,
              callbackMarker: undefined,
            }
          : node,
      ),
    };
    const result = new NarrativeThreadValidationService().validateThread(broken);
    assert.equal(result.passesAll, false);
    assert.equal(result.errors.some((error) => error.includes("callback")), true);
  });

  it("enforces thread state transition rules", () => {
    const service = new NarrativeThreadValidationService();
    assert.equal(service.validateThreadStateTransition("seeded", "active"), true);
    assert.equal(service.validateThreadStateTransition("resolved", "latent"), false);
  });
});
