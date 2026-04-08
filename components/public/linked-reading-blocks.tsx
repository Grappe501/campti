"use client";

import { useMemo, type ReactNode } from "react";
import { splitReadingBlocks } from "@/lib/reading-blocks";
import type { SidePanelEntity } from "@/components/public/SidePanel";

export type ReadingLinkEntity = {
  kind: SidePanelEntity["kind"];
  id: string;
  name: string;
};

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkifyParagraph(
  text: string,
  entities: ReadingLinkEntity[],
  onEntity: (e: ReadingLinkEntity) => void,
  linkClass: string,
): ReactNode[] {
  if (!entities.length) return [text];
  const sorted = [...entities].sort((a, b) => b.name.length - a.name.length);
  const parts: ReactNode[] = [];
  let remaining = text;
  let guard = 0;
  while (remaining.length && guard++ < 5000) {
    let best: { index: number; len: number; e: ReadingLinkEntity } | null = null;
    for (const e of sorted) {
      if (e.name.length < 2) continue;
      const re = new RegExp(`\\b${escapeRe(e.name)}\\b`, "i");
      const m = remaining.match(re);
      if (!m || m.index === undefined) continue;
      if (
        !best ||
        m.index < best.index ||
        (m.index === best.index && m[0].length > best.len)
      ) {
        best = { index: m.index, len: m[0].length, e };
      }
    }
    if (!best) {
      parts.push(remaining);
      break;
    }
    if (best.index > 0) parts.push(remaining.slice(0, best.index));
    const label = remaining.slice(best.index, best.index + best.len);
    parts.push(
      <button
        key={`${parts.length}-${best.e.id}`}
        type="button"
        onClick={() => onEntity(best!.e)}
        className={`border-b border-current/30 bg-transparent font-inherit leading-inherit transition hover:border-amber-200/50 ${linkClass}`}
      >
        {label}
      </button>,
    );
    remaining = remaining.slice(best.index + best.len);
  }
  return parts;
}

export function ReadingParagraph({
  block,
  entities,
  onEntityClick,
  paragraphClassName,
  entityLinkClassName,
}: {
  block: string;
  entities: ReadingLinkEntity[];
  onEntityClick: (e: ReadingLinkEntity) => void;
  paragraphClassName: string;
  entityLinkClassName: string;
}) {
  return (
    <p className={paragraphClassName}>
      {linkifyParagraph(block, entities, onEntityClick, entityLinkClassName)}
    </p>
  );
}

type LinkedReadingBlocksProps = {
  text: string;
  entities: ReadingLinkEntity[];
  onEntityClick: (e: ReadingLinkEntity) => void;
  immersive?: boolean;
  /** Overrides default paragraph styling when set (e.g. tone-matched immersive type). */
  paragraphClassName?: string;
  entityLinkClassName?: string;
  className?: string;
};

export function LinkedReadingBlocks({
  text,
  entities,
  onEntityClick,
  immersive = false,
  paragraphClassName: paraOverride,
  entityLinkClassName: linkOverride,
  className = "",
}: LinkedReadingBlocksProps) {
  const blocks = useMemo(() => splitReadingBlocks(text), [text]);

  const paraClass =
    paraOverride ??
    (immersive
      ? "font-serif text-[1.125rem] leading-[2.05] tracking-[0.01em] text-stone-100/90 sm:text-[1.2rem] sm:leading-[2.12]"
      : "font-serif text-[1.05rem] leading-[1.85] text-stone-200 sm:text-lg sm:leading-[1.9]");

  const linkClass =
    linkOverride ??
    (immersive
      ? "text-sky-100/85 cursor-pointer text-left"
      : "text-amber-100/85 cursor-pointer text-left");

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
        <p key={i} className={paraClass}>
          {linkifyParagraph(block, entities, onEntityClick, linkClass)}
        </p>
      ))}
    </div>
  );
}
