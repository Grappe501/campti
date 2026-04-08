import { splitReadingBlocks } from "@/lib/reading-blocks";

type SceneReaderProps = {
  text: string;
  className?: string;
};

/** Renders long-form reading text as calm, book-like paragraphs (plain text only). */
export function SceneReader({ text, className = "" }: SceneReaderProps) {
  const blocks = splitReadingBlocks(text);
  if (!blocks.length) {
    return (
      <p className="text-sm italic text-stone-500">
        This passage is still gathering shape.
      </p>
    );
  }
  return (
    <div className={`space-y-8 ${className}`}>
      {blocks.map((block, i) => (
        <p
          key={i}
          className="font-serif text-[1.05rem] leading-[1.85] text-stone-200 sm:text-lg sm:leading-[1.9]"
        >
          {block.trim()}
        </p>
      ))}
    </div>
  );
}
