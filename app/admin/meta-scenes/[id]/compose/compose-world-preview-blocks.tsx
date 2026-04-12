import type { RichWorldStatePreview } from "@/lib/descriptive-synthesis";

const BLOCKS: { key: keyof Pick<RichWorldStatePreview, "povSummary" | "environmentSummary" | "emotionalContext" | "constraintsSummary" | "symbolicSummary">; heading: string }[] = [
  { key: "povSummary", heading: "POV perspective summary" },
  { key: "environmentSummary", heading: "Environment" },
  { key: "emotionalContext", heading: "Emotional context" },
  { key: "constraintsSummary", heading: "Constraints" },
  { key: "symbolicSummary", heading: "Symbolic" },
];

type Props = { preview: RichWorldStatePreview };

export function ComposeWorldPreviewBlocks({ preview }: Props) {
  return (
    <>
      {BLOCKS.map(({ key, heading }) => (
        <section key={key}>
          <h4 className="text-xs font-medium uppercase text-stone-500">{heading}</h4>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">{preview[key]}</pre>
        </section>
      ))}
    </>
  );
}
