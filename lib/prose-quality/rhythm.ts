import type { RhythmMetrics } from "@/lib/prose-quality/types";

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const v =
    nums.reduce((s, x) => s + (x - m) * (x - m), 0) / (nums.length - 1);
  return Math.sqrt(v);
}

function maxRunSameBucket(lengths: number[], bucketSize: number): number {
  if (lengths.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < lengths.length; i++) {
    const sameBucket =
      Math.floor(lengths[i] / bucketSize) ===
      Math.floor(lengths[i - 1] / bucketSize);
    if (sameBucket) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function analyzeRhythm(sentenceLengths: number[]): RhythmMetrics {
  const m = mean(sentenceLengths);
  const sd = stdev(sentenceLengths);
  const cv = m > 0 ? sd / m : 0;
  const maxRun = maxRunSameBucket(sentenceLengths, 8);
  const monotonousRhythm = sentenceLengths.length >= 8 && cv < 0.18 && maxRun >= 5;

  return {
    sentenceCount: sentenceLengths.length,
    lengths: sentenceLengths,
    meanLength: m,
    stdevLength: sd,
    coefficientOfVariation: cv,
    maxRunSameLengthBucket: maxRun,
    monotonousRhythm,
  };
}
