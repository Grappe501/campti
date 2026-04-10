/** Stable IDs for the full demo novel — referenced by prisma/seed-full-demo.ts */
export const DEMO = {
  places: {
    cemetery: "demo-place-cemetery-campti",
    landing: "demo-place-natchitoches-landing",
    kitchen: "demo-place-grappe-kitchen",
    caneRiver: "demo-place-cane-river-corridor",
  },
  chapters: {
    ch3: "demo-ch-3",
    ch4: "demo-ch-4",
    ch5: "demo-ch-5",
    ch6: "demo-ch-6",
    ch7: "demo-ch-7",
    ch8: "demo-ch-8",
    ch9: "demo-ch-9",
    ch10: "demo-ch-10",
    ch11: "demo-ch-11",
    ch12: "demo-ch-12",
  },
  sourceMain: "demo-source-smoke-corridor",
  theme: {
    hybridity: "demo-theme-hybridity",
    land: "demo-theme-land-memory",
    seam: "demo-theme-seam",
  },
  rule: {
    labelOral: "demo-rule-label-oral",
  },
  motif: {
    smoke: "demo-motif-smoke-return",
  },
  pattern: {
    generational: "demo-pattern-generational-echo",
  },
  device: {
    seam: "demo-device-seam-reveal",
  },
  cluster: {
    smoke: "demo-cluster-smoke-lineage",
    paper: "demo-cluster-paper-trail",
  },
} as const;
