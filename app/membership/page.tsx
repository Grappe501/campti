import Link from "next/link";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { AudioTeaser } from "@/components/public/audio-teaser";
import { MembershipTierCard } from "@/components/public/membership-tier-card";
import { PublicSiteChrome } from "@/components/public/public-site-chrome";
import { getPublicMembershipContent } from "@/lib/public-data";

export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-campti-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-campti-sans",
});

export const metadata: Metadata = {
  title: "Depth & membership — Campti",
  description:
    "Free reading and a future deeper layer: expanded interiors, symbolism, and immersive experiences.",
  openGraph: {
    title: "Depth & membership — Campti",
    description: "The story is free to enter. Membership is for those who want to stay longer.",
  },
};

export default async function MembershipPage() {
  const content = await getPublicMembershipContent();

  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0f0e0c] font-sans text-stone-200 antialiased`}
      style={{ fontFamily: "var(--font-campti-sans), system-ui, sans-serif" }}
    >
      <PublicSiteChrome />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:px-10">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          Membership
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-campti-display),Georgia,serif] text-4xl text-stone-100 sm:text-5xl">
          Go deeper without turning up the volume
        </h1>
        <p className="mt-8 text-lg leading-relaxed text-stone-400">{content.intro}</p>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {content.tiers.map((tier) => (
            <MembershipTierCard key={tier.id} tier={tier} />
          ))}
        </div>

        <section className="mt-20 space-y-6">
          <h2 className="font-[family-name:var(--font-campti-display),Georgia,serif] text-2xl text-stone-100">
            Listen and experience
          </h2>
          <p className="text-sm leading-relaxed text-stone-500">
            Audio is being prepared as its own craft—scene readings, environmental beds,
            voices that respect silence between sentences.
          </p>
          <AudioTeaser
            label="Immersive listening"
            sublabel="Member previews will appear here first."
          />
        </section>

        <p className="mt-16 border-t border-stone-800 pt-10 text-center text-sm italic text-stone-600">
          {content.footnote}
        </p>

        <div className="mt-10 text-center">
          <Link
            href="/read"
            className="text-xs uppercase tracking-[0.2em] text-amber-200/60 hover:text-amber-100"
          >
            ← Return to the story
          </Link>
        </div>
      </main>
    </div>
  );
}
