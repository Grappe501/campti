import {
  RecordType,
  RuleScope,
  RuleSeverity,
  RuleType,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

type SeedRow = {
  key: string;
  name: string;
  description: string;
  ruleType: RuleType;
  scope: RuleScope;
  severity: RuleSeverity;
  notes?: string;
};

const ROWS: SeedRow[] = [
  {
    key: "truth-no-unsupported-claims",
    name: "No unsupported claim as historical fact",
    description: "No unsupported claim may be treated as historical fact.",
    ruleType: RuleType.TRUTH,
    scope: RuleScope.GLOBAL,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "truth-oral-history-labeled",
    name: "Oral history stays labeled",
    description: "Oral history must remain labeled as oral_history.",
    ruleType: RuleType.TRUTH,
    scope: RuleScope.GLOBAL,
    severity: RuleSeverity.WARNING,
  },
  {
    key: "ambiguity-contradictions-visible",
    name: "Contradictions remain visible",
    description: "Unresolved contradictions must remain visible.",
    ruleType: RuleType.AMBIGUITY,
    scope: RuleScope.GLOBAL,
    severity: RuleSeverity.WARNING,
  },
  {
    key: "ambiguity-identity-not-collapsed",
    name: "Ambiguous identity not collapsed",
    description: "Ambiguous identity must not be collapsed into certainty.",
    ruleType: RuleType.AMBIGUITY,
    scope: RuleScope.ENTITY,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "reveal-narrator-concealed",
    name: "Narrator identity concealed until allowed",
    description: "Narrator identity must remain concealed until allowed reveal stage.",
    ruleType: RuleType.REVEAL,
    scope: RuleScope.VOICE,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "reveal-no-future-leak",
    name: "No future knowledge in earlier POV",
    description: "Future knowledge cannot leak into earlier timeline POV.",
    ruleType: RuleType.REVEAL,
    scope: RuleScope.SCENE,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "voice-no-dialect-flatten",
    name: "Do not flatten dialect or voice",
    description: "AI may not flatten dialect or voice.",
    ruleType: RuleType.VOICE,
    scope: RuleScope.VOICE,
    severity: RuleSeverity.WARNING,
  },
  {
    key: "voice-respect-pov",
    name: "Voice respects POV constraints",
    description: "Voice must respect POV constraints.",
    ruleType: RuleType.VOICE,
    scope: RuleScope.CHARACTER,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "violence-no-spectacle",
    name: "Violence not spectacle",
    description: "Violence cannot be rendered as spectacle.",
    ruleType: RuleType.VIOLENCE,
    scope: RuleScope.SCENE,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "violence-dignity-trauma",
    name: "Trauma and dignity",
    description: "Trauma must respect dignity constraints.",
    ruleType: RuleType.VIOLENCE,
    scope: RuleScope.GLOBAL,
    severity: RuleSeverity.WARNING,
  },
  {
    key: "theology-implicit-not-contradictory",
    name: "Theological meaning implicit, coherent",
    description: "Theological meaning may be implicit but must not contradict worldview.",
    ruleType: RuleType.THEOLOGY,
    scope: RuleScope.GLOBAL,
    severity: RuleSeverity.WARNING,
  },
  {
    key: "theology-sacred-language-respect",
    name: "Sacred language respects voice and POV",
    description: "Sacred language must respect voice and POV.",
    ruleType: RuleType.THEOLOGY,
    scope: RuleScope.VOICE,
    severity: RuleSeverity.INFO,
  },
  {
    key: "determinism-anchors-fixed",
    name: "Fixed anchors cannot be violated",
    description: "Fixed anchors cannot be violated.",
    ruleType: RuleType.DETERMINISM,
    scope: RuleScope.SYSTEM,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "determinism-branch-constrained",
    name: "Branching within defined constraints",
    description: "Branching must stay within defined constraints.",
    ruleType: RuleType.DETERMINISM,
    scope: RuleScope.SYSTEM,
    severity: RuleSeverity.WARNING,
  },
  {
    key: "draft-eligibility-scene-preconditions",
    name: "Scene preconditions for drafting",
    description:
      "Scene cannot be drafted without POV, place, time, pressure, and constraints defined.",
    ruleType: RuleType.DRAFT_ELIGIBILITY,
    scope: RuleScope.SCENE,
    severity: RuleSeverity.BLOCKING,
  },
  {
    key: "draft-eligibility-readiness-gates",
    name: "Readiness gates before prose",
    description: "Composition readiness gates must be satisfied before prose generation (when enabled).",
    ruleType: RuleType.DRAFT_ELIGIBILITY,
    scope: RuleScope.SYSTEM,
    severity: RuleSeverity.BLOCKING,
  },
];

export async function seedConstitutionalRules(): Promise<void> {
  for (const row of ROWS) {
    await prisma.constitutionalRule.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        description: row.description,
        ruleType: row.ruleType,
        scope: row.scope,
        severity: row.severity,
        isActive: true,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.REVIEW,
        notes: row.notes ?? null,
      },
      create: {
        key: row.key,
        name: row.name,
        description: row.description,
        ruleType: row.ruleType,
        scope: row.scope,
        severity: row.severity,
        isActive: true,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.REVIEW,
        certainty: "system",
        notes: row.notes ?? null,
      },
    });
  }
}
