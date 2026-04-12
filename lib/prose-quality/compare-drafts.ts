import { splitSentences } from "@/lib/prose-quality/sentence-split";
import type { ProseComparisonV1 } from "@/lib/prose-quality/types";

/** Longest common subsequence over sentence arrays → rough stability. */
function lcsLength<T>(a: T[], b: T[]): number {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      else
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp[n]![m]!;
}

function normalizeSentence(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Sentence-level diff for human revision review (not byte-perfect).
 */
export function compareProseDrafts(
  left: string,
  right: string,
  leftLabel: string,
  rightLabel: string
): ProseComparisonV1 {
  const ls = splitSentences(left).map(normalizeSentence);
  const rs = splitSentences(right).map(normalizeSentence);
  const unchanged = lcsLength(ls, rs);
  const sentencesAdded = Math.max(0, rs.length - unchanged);
  const sentencesRemoved = Math.max(0, ls.length - unchanged);
  const stabilityRatio =
    ls.length + rs.length === 0
      ? 1
      : (2 * unchanged) / (ls.length + rs.length);

  const diffLines = buildSentenceDiff(left, right, leftLabel, rightLabel);

  return {
    version: 1,
    leftLabel,
    rightLabel,
    leftWordCount: left.split(/\s+/).filter(Boolean).length,
    rightWordCount: right.split(/\s+/).filter(Boolean).length,
    sentencesAdded,
    sentencesRemoved,
    sentencesUnchanged: unchanged,
    stabilityRatio,
    diffLines,
  };
}

function buildSentenceDiff(
  left: string,
  right: string,
  leftLabel: string,
  rightLabel: string
): string[] {
  const ls = splitSentences(left);
  const rs = splitSentences(right);
  const out: string[] = [
    `--- ${leftLabel}`,
    `+++ ${rightLabel}`,
    "",
  ];
  const max = Math.max(ls.length, rs.length);
  for (let i = 0; i < max; i++) {
    const l = ls[i];
    const r = rs[i];
    if (l === undefined) out.push(`+ ${r ?? ""}`);
    else if (r === undefined) out.push(`- ${l}`);
    else if (normalizeSentence(l) === normalizeSentence(r)) out.push(`  ${l}`);
    else {
      out.push(`- ${l}`);
      out.push(`+ ${r}`);
    }
  }
  return out;
}
