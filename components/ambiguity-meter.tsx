export function AmbiguityMeter({ level }: { level: number | null | undefined }) {
  const n = level ?? 0;
  const capped = Math.min(5, Math.max(0, n));
  return (
    <div className="flex items-center gap-1.5" title={`Ambiguity ${capped}/5`}>
      <span className="text-xs text-stone-500">Ambiguity</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < capped ? "bg-amber-500" : "bg-stone-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
