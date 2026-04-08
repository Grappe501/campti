import type { Metadata } from "next";
import { TimelineSection } from "@/components/public/timeline-section";
import { getPublicTimelineData } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Timeline — Campti",
  description: "Public historical anchors and story events across time.",
};

export default async function ReadTimelinePage() {
  const eras = await getPublicTimelineData();

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          The long weather of years
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100">
          Timeline
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          Decades gathered into bands. Each event links outward—chapters, people, and ground—
          only when those threads are public too.
        </p>
      </header>

      {eras.length === 0 ? (
        <p className="text-sm text-stone-500">
          No dated anchors are visible yet. When events are marked for readers, they will
          gather here.
        </p>
      ) : (
        <TimelineSection eras={eras} />
      )}
    </div>
  );
}
