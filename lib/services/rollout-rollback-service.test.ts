import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRollbackControl,
  createDeploymentEnvironment,
  createRolloutControl,
  promoteRollout,
} from "@/lib/services/deployment-commercial-layer-service";

describe("rollout-rollback", () => {
  it("supports bounded promotion then rollback path", () => {
    const development = createDeploymentEnvironment({ environmentId: "env-dev", environmentType: "development" });
    const staging = createDeploymentEnvironment({ environmentId: "env-stage", environmentType: "staging" });
    const rollout = createRolloutControl({
      rolloutId: "rollout-1",
      packageId: "pkg-1",
      releaseVersion: "v1",
      currentEnvironment: "development",
    });
    const promoted = promoteRollout({
      rollout,
      fromEnvironment: development,
      toEnvironment: staging,
    });
    const rollback = buildRollbackControl({
      rollbackId: "rollback-1",
      rollout: promoted,
      toVersion: "v0",
      reason: "anomaly",
    });
    assert.equal(rollback.fromVersion, "v1");
    assert.equal(promoted.currentEnvironment, "staging");
  });
});
