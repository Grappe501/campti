import { execSync } from "node:child_process";

const steps = [
  "tsx scripts/run-book1-chapter-01-regeneration-loop.ts",
  "tsx scripts/run-book1-chapter-01-render-stability.ts",
  "tsx scripts/review-book1-chapter-01-adversarial.ts",
  "tsx scripts/run-book1-chapter-01-decision-panel.ts",
];

for (const step of steps) {
  execSync(step, { stdio: "inherit" });
}

console.log(
  JSON.stringify(
    {
      chapter: 1,
      executedSteps: steps,
      reports: [
        "reports/book1-chapter-01-critic-feedback-map.json",
        "reports/book1-chapter-01-high-finding-reduction-plan.json",
        "reports/book1-chapter-01-render-stability.json",
        "reports/book1-chapter-01-enneagram-operating-layer.json",
        "reports/book1-chapter-01-enneagram-mediation-layer.json",
        "reports/book1-chapter-01-consciousness-cohesion-router.json",
        "reports/book1-chapter-01-voice-identity-stabilizer.json",
        "reports/book1-chapter-01-embodied-inner-life-router.json",
        "reports/book1-chapter-01-regenerated-draft.json",
        "reports/book1-chapter-01-regenerated-draft.txt",
        "reports/book1-chapter-01-prose-shape-critic.json",
        "reports/book1-chapter-01-prose-shape-summary.json",
        "reports/book1-chapter-01-adversarial-summary.json",
        "reports/book1-chapter-01-decision-panel.json",
        "reports/book1-chapter-01-regeneration-diff.json",
        "reports/book1-chapter-01-regeneration-summary.json",
      ],
    },
    null,
    2,
  ),
);
