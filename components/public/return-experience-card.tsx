import Link from "next/link";
import type { PublicReturnExperience } from "@/lib/public-data";

export type ReturnExperienceCardProps = {
  experience: PublicReturnExperience;
  className?: string;
};

/**
 * Quiet return layer — headline, mood line, single CTA. No internal system language.
 */
export function ReturnExperienceCard({ experience, className = "" }: ReturnExperienceCardProps) {
  return (
    <aside
      className={`rounded-lg border border-amber-900/20 bg-stone-900/35 px-6 py-5 sm:px-8 ${className}`}
    >
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
        Return
      </p>
      <p className="mt-2 font-serif text-xl text-amber-100/90">{experience.headline}</p>
      {experience.moodLine?.trim() ? (
        <p className="mt-3 text-xs italic leading-relaxed text-stone-600">{experience.moodLine.trim()}</p>
      ) : null}
      {experience.chapterTitle ? (
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          <span className="text-stone-400">{experience.chapterTitle}</span>
          {experience.sceneLabel ? (
            <>
              <span className="text-stone-600"> · </span>
              <span>{experience.sceneLabel}</span>
            </>
          ) : null}
        </p>
      ) : null}
      {experience.preferredModeLabel ? (
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-stone-600">
          {experience.preferredModeLabel} mode can restore when you return
        </p>
      ) : null}
      <Link
        href={experience.href}
        className="mt-5 inline-block text-[0.7rem] uppercase tracking-[0.22em] text-amber-200/80 transition hover:text-amber-50"
      >
        {experience.ctaLabel} →
      </Link>
    </aside>
  );
}
