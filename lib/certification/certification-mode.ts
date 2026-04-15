export type CertificationMode = "default" | "strict";

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function getCertificationMode(): CertificationMode {
  const raw = normalize(process.env.CERTIFICATION_MODE) || normalize(process.env.CERT_MODE);
  if (raw === "strict") return "strict";
  return "default";
}

export function isStrictCertificationMode(): boolean {
  return getCertificationMode() === "strict";
}
