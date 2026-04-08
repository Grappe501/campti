export function ConfidenceDot({ level }: { level: number | null | undefined }) {
  const n = level ?? 0;
  const capped = Math.min(5, Math.max(1, n || 1));
  const heat =
    capped >= 4 ? "bg-emerald-500" : capped >= 3 ? "bg-amber-500" : "bg-stone-400";
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`Confidence ${capped}/5`}
    >
      <span className="text-xs text-stone-500">Confidence</span>
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${heat}`} />
      <span className="text-xs tabular-nums text-stone-600">{capped}</span>
    </span>
  );
}
