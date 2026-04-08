const tone: Record<string, string> = {
  open: "bg-amber-100 text-amber-950 ring-amber-200",
  researching: "bg-sky-100 text-sky-950 ring-sky-200",
  resolved: "bg-emerald-100 text-emerald-950 ring-emerald-200",
  low: "bg-stone-100 text-stone-800 ring-stone-200",
  medium: "bg-amber-100 text-amber-950 ring-amber-200",
  high: "bg-rose-100 text-rose-950 ring-rose-200",
  private: "bg-stone-200 text-stone-900 ring-stone-300",
  review: "bg-amber-100 text-amber-950 ring-amber-200",
  public: "bg-emerald-100 text-emerald-950 ring-emerald-200",
};

type StatusBadgeProps = {
  label: string;
  className?: string;
};

export function StatusBadge({ label, className = "" }: StatusBadgeProps) {
  const key = label.toLowerCase();
  const styles = tone[key] ?? "bg-stone-100 text-stone-800 ring-stone-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
