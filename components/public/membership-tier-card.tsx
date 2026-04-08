import type { PublicMembershipTier } from "@/lib/public-data";

type MembershipTierCardProps = {
  tier: PublicMembershipTier;
};

export function MembershipTierCard({ tier }: MembershipTierCardProps) {
  return (
    <article
      className={
        tier.emphasis
          ? "flex flex-col rounded-lg border border-amber-900/35 bg-gradient-to-b from-amber-950/20 to-stone-950/40 p-8 shadow-[0_0_0_1px_rgba(180,83,9,0.08)]"
          : "flex flex-col rounded-lg border border-stone-800 bg-stone-900/30 p-8"
      }
    >
      <h3 className="font-serif text-2xl text-stone-100">{tier.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-stone-400">{tier.description}</p>
      <ul className="mt-6 space-y-3 text-sm text-stone-300">
        {tier.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-700/60" />
            <span className="leading-relaxed text-stone-400">{b}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
