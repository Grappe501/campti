import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertEnvironmentPromotionAllowed,
  createDeploymentEnvironment,
} from "@/lib/services/deployment-commercial-layer-service";

describe("deployment-governance", () => {
  it("blocks unsafe environment promotion jumps", () => {
    const development = createDeploymentEnvironment({ environmentId: "env-dev", environmentType: "development" });
    const production = createDeploymentEnvironment({ environmentId: "env-prod", environmentType: "production" });
    assert.throws(() => assertEnvironmentPromotionAllowed({ fromEnvironment: development, toEnvironment: production }));
  });
});
