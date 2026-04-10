import {
  RecordType,
  RuleScope,
  RuleSeverity,
  RuleType,
  VisibilityStatus,
} from "@prisma/client";

/** Stable UI / form ordering for constitutional policy kinds. */
export const RULE_TYPE_ORDER: RuleType[] = [
  RuleType.TRUTH,
  RuleType.AMBIGUITY,
  RuleType.REVEAL,
  RuleType.VOICE,
  RuleType.VIOLENCE,
  RuleType.THEOLOGY,
  RuleType.DETERMINISM,
  RuleType.DRAFT_ELIGIBILITY,
];

export const RULE_SCOPE_ORDER: RuleScope[] = [
  RuleScope.GLOBAL,
  RuleScope.SYSTEM,
  RuleScope.ENTITY,
  RuleScope.SCENE,
  RuleScope.CHARACTER,
  RuleScope.VOICE,
];

export const RULE_SEVERITY_ORDER: RuleSeverity[] = [
  RuleSeverity.INFO,
  RuleSeverity.WARNING,
  RuleSeverity.BLOCKING,
];

export const RECORD_TYPE_ORDER: RecordType[] = [
  RecordType.HISTORICAL,
  RecordType.ORAL_HISTORY,
  RecordType.INFERRED,
  RecordType.FICTIONAL,
  RecordType.HYBRID,
];

export const VISIBILITY_ORDER: VisibilityStatus[] = [
  VisibilityStatus.PRIVATE,
  VisibilityStatus.REVIEW,
  VisibilityStatus.PUBLIC,
];
