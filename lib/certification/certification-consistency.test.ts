/**
 * Certification mode/enforcement consistency tests.
 * Run: npx tsx --test lib/certification/certification-consistency.test.ts
 */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import { getCertificationMode, isStrictCertificationMode } from "@/lib/certification/certification-mode";

const prevCertificationMode = process.env.CERTIFICATION_MODE;
const prevCertMode = process.env.CERT_MODE;

function restoreEnv(): void {
  if (prevCertificationMode === undefined) delete process.env.CERTIFICATION_MODE;
  else process.env.CERTIFICATION_MODE = prevCertificationMode;

  if (prevCertMode === undefined) delete process.env.CERT_MODE;
  else process.env.CERT_MODE = prevCertMode;
}

afterEach(() => {
  restoreEnv();
});

describe("certification-mode", () => {
  it("defaults to default mode when env is unset", () => {
    delete process.env.CERTIFICATION_MODE;
    delete process.env.CERT_MODE;
    assert.equal(getCertificationMode(), "default");
    assert.equal(isStrictCertificationMode(), false);
  });

  it("resolves strict mode from CERTIFICATION_MODE", () => {
    process.env.CERTIFICATION_MODE = "strict";
    delete process.env.CERT_MODE;
    assert.equal(getCertificationMode(), "strict");
    assert.equal(isStrictCertificationMode(), true);
  });

  it("resolves strict mode from CERT_MODE alias", () => {
    delete process.env.CERTIFICATION_MODE;
    process.env.CERT_MODE = "strict";
    assert.equal(getCertificationMode(), "strict");
    assert.equal(isStrictCertificationMode(), true);
  });
});

describe("enforceCertificationResults consistency", () => {
  it("fails strict mode when a critical check is skipped", () => {
    process.env.CERTIFICATION_MODE = "strict";
    const summary = enforceCertificationResults({
      checks: [
        {
          name: "migration_readiness",
          ok: true,
          severity: "critical",
          details: { skipped: true, error: "Migration drift detected." },
        },
      ],
    });
    assert.equal(summary.ok, false);
    assert.ok(summary.failures.some((m) => /skipped in strict certification mode/i.test(m)));
  });

  it("allows skipped critical checks in default mode", () => {
    delete process.env.CERTIFICATION_MODE;
    delete process.env.CERT_MODE;
    const summary = enforceCertificationResults({
      checks: [
        {
          name: "migration_readiness",
          ok: true,
          severity: "critical",
          details: { skipped: true, error: "Migration drift detected." },
        },
      ],
    });
    assert.equal(summary.ok, true);
    assert.equal(summary.failures.length, 0);
  });

  it("fails when required command result is not ok", () => {
    process.env.CERTIFICATION_MODE = "strict";
    const summary = enforceCertificationResults({
      checks: [{ name: "baseline", ok: true, severity: "critical" }],
      commandResults: [{ command: "npm run verify:contracts", ok: false }],
    });
    assert.equal(summary.ok, false);
    assert.ok(summary.failures.some((m) => /required command/i.test(m)));
  });
});
