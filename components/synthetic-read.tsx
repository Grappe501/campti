type Props = {
  title?: string;
  children: React.ReactNode;
};

/** Labels machine synthesis so it never masquerades as authored canon. */
export function SyntheticRead({ title = "Synthesized read", children }: Props) {
  return (
    <div className="rounded-lg border border-violet-100/90 bg-violet-50/35 p-4 text-sm text-stone-800">
      <p className="text-xs font-medium uppercase tracking-wide text-violet-900/75">{title}</p>
      <p className="mt-1.5 text-xs text-violet-800/70">
        Template + your structured fields — not final prose. Editable elsewhere; safe to ignore.
      </p>
      <div className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-800">{children}</div>
    </div>
  );
}
