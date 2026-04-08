import Link from "next/link";
import type { ReactNode } from "react";

type WorldEntryCardProps = {
  href: string;
  title: string;
  description: string;
  meta?: string;
  footer?: ReactNode;
};

export function WorldEntryCard({
  href,
  title,
  description,
  meta,
  footer,
}: WorldEntryCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-stone-700/60 bg-stone-900/40 p-6 transition hover:border-amber-900/40 hover:bg-stone-900/70"
    >
      {meta ? (
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-stone-500">
          {meta}
        </span>
      ) : null}
      <h3 className="mt-2 font-serif text-xl text-stone-100 transition group-hover:text-amber-100/90">
        {title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-400">{description}</p>
      <span className="mt-5 text-xs text-amber-200/60 transition group-hover:text-amber-200/90">
        Enter →
      </span>
      {footer ? <div className="mt-4 border-t border-stone-800 pt-4">{footer}</div> : null}
    </Link>
  );
}
