const SECTIONS: { id: string; label: string }[] = [
  { id: "compose-intelligence", label: "Intelligence" },
  { id: "compose-soul", label: "Soul" },
  { id: "compose-panel-1", label: "Scene core" },
  { id: "compose-panel-2", label: "Character" },
  { id: "compose-panel-3", label: "Environment" },
  { id: "compose-panel-4", label: "Constraints" },
  { id: "compose-panel-5", label: "Conflict" },
  { id: "compose-panel-6", label: "Symbolic" },
  { id: "compose-context-meta", label: "Meta" },
  { id: "compose-panel-8", label: "Sources" },
  { id: "compose-fragments", label: "Fragments" },
  { id: "compose-narrative", label: "Passes / cache" },
  { id: "compose-panel-9", label: "World preview" },
  { id: "compose-panel-10", label: "Perspective" },
];

const linkClass =
  "rounded-full border border-stone-200 bg-white px-2.5 py-1 text-stone-700 hover:border-amber-300 hover:bg-amber-50/80 hover:text-stone-900";

/** Sticky in-page navigation for the long compose screen. */
export function ComposeSectionNav() {
  return (
    <nav
      aria-label="Compose page sections"
      className="sticky top-0 z-20 -mx-1 mb-6 rounded-xl border border-stone-200/90 bg-stone-50/95 px-3 py-2.5 shadow-sm backdrop-blur-sm md:mx-0"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Jump to section</p>
      <div className="flex max-h-[min(40vh,14rem)] flex-wrap gap-1.5 overflow-y-auto text-xs leading-snug md:max-h-none md:overflow-visible">
        {SECTIONS.map(({ id, label }) => (
          <a key={id} href={`#${id}`} className={linkClass}>
            {label}
          </a>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-stone-500">
        Panels 4–8 (constraints through source grounding) save together with the button at the end of that block.
      </p>
    </nav>
  );
}
