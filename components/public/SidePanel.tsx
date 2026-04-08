"use client";

import Link from "next/link";

export type SidePanelEntity =
  | { kind: "person"; id: string; name: string; description: string | null }
  | { kind: "place"; id: string; name: string; description: string | null }
  | { kind: "symbol"; id: string; name: string; meaning: string | null };

type SidePanelProps = {
  open: boolean;
  entity: SidePanelEntity | null;
  onClose: () => void;
};

export function SidePanel({ open, entity, onClose }: SidePanelProps) {
  if (!open || !entity) return null;

  const href =
    entity.kind === "person"
      ? `/read/characters/${entity.id}`
      : entity.kind === "place"
        ? `/read/places/${entity.id}`
        : `/read/symbols#${entity.id}`;

  const title = entity.name;
  const body =
    entity.kind === "symbol"
      ? entity.meaning?.trim() || "A motif carried through the world of the book."
      : entity.description?.trim() || "A thread named in this passage—open the full entry for more context.";

  const label =
    entity.kind === "person" ? "Character" : entity.kind === "place" ? "Place" : "Symbol";

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />
      <aside
        className="campti-side-panel fixed right-0 top-0 z-50 flex h-full w-[min(100%,22rem)] flex-col border-l border-stone-800/90 bg-[#0f0e0c]/95 px-6 py-10 shadow-[-12px_0_40px_rgba(0,0,0,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            {label}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-stone-700 px-2 py-1 text-xs text-stone-400 transition hover:border-stone-600 hover:text-stone-200"
          >
            Close
          </button>
        </div>
        <h2
          id="side-panel-title"
          className="mt-4 font-serif text-xl font-normal leading-snug text-stone-100"
        >
          {title}
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-stone-400">{body}</p>
        <div className="mt-auto pt-10">
          <Link
            href={href}
            className="text-sm text-amber-200/80 underline-offset-4 transition hover:text-amber-100 hover:underline"
          >
            Open full page
          </Link>
        </div>
      </aside>
    </>
  );
}
