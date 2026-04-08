import Link from "next/link";
import type { ReactNode } from "react";

type ExploreDeeperCardProps = {
  href?: string;
  title?: string;
  children?: ReactNode;
};

export function ExploreDeeperCard({
  href = "/membership",
  title = "Explore deeper",
  children,
}: ExploreDeeperCardProps) {
  return (
    <aside className="rounded-lg border border-dashed border-amber-900/25 bg-amber-950/10 px-6 py-8">
      <h3 className="font-serif text-xl text-amber-100/90">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-stone-400">
        {children ?? (
          <p>
            Some corridors stay dim for every visitor. Membership will open richer character
            interiors, fuller timelines, and immersive scene experiences—without crowding what
            belongs to the page.
          </p>
        )}
      </div>
      <Link
        href={href}
        className="mt-5 inline-flex text-xs font-medium uppercase tracking-[0.2em] text-amber-200/70 transition hover:text-amber-100"
      >
        Depth & access →
      </Link>
    </aside>
  );
}
