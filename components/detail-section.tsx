import type { ReactNode } from "react";

type DetailSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function DetailSection({
  title,
  children,
  className = "",
}: DetailSectionProps) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h2>
      <div className="mt-3 text-sm text-stone-800">{children}</div>
    </section>
  );
}
