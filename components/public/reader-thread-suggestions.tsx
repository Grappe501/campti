import Link from "next/link";
import type { ReaderThreadHint } from "@/lib/reader-threads";

type Props = {
  threads: ReaderThreadHint[];
  title?: string;
  className?: string;
};

/**
 * Literary thread strip — uses attachment-aware hints only (no “algorithm” language).
 */
export function ReaderThreadSuggestions({
  threads,
  title = "You might feel drawn to…",
  className = "",
}: Props) {
  if (!threads.length) return null;
  const sorted = [...threads].sort((a, b) => b.weight - a.weight).slice(0, 6);
  return (
    <nav className={`space-y-3 ${className}`} aria-label="Reading threads">
      <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {sorted.map((t) => (
          <li key={`${t.href}-${t.label}`}>
            <Link
              href={t.href}
              className="text-sm text-stone-400 underline-offset-4 transition hover:text-amber-100/85 hover:underline"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
