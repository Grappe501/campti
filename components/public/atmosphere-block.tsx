import type { ReactNode } from "react";

type AtmosphereBlockProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function AtmosphereBlock({
  title,
  children,
  className = "",
}: AtmosphereBlockProps) {
  return (
    <section
      className={`rounded-lg border border-stone-800/80 bg-stone-950/40 px-5 py-6 sm:px-6 ${className}`}
    >
      <h3 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-amber-200/50">
        {title}
      </h3>
      <div className="mt-4 text-sm leading-relaxed text-stone-400">{children}</div>
    </section>
  );
}
