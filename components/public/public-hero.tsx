import type { ReactNode } from "react";

type PublicHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  /** Taller gradient hero for the home route */
  variant?: "home" | "compact";
};

export function PublicHero({
  eyebrow,
  title,
  subtitle,
  children,
  variant = "compact",
}: PublicHeroProps) {
  return (
    <section
      className={
        variant === "home"
          ? "relative flex min-h-[88vh] flex-col justify-end overflow-hidden px-6 pb-20 pt-28 sm:px-10 lg:px-16"
          : "relative overflow-hidden px-6 py-16 sm:px-10 lg:px-16"
      }
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(139,69,19,0.12),transparent_50%),radial-gradient(ellipse_at_80%_40%,rgba(90,74,58,0.15),transparent_55%),linear-gradient(to_bottom,rgba(15,14,12,0.3),#0f0e0c)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.06)_2px,rgba(255,255,255,0.06)_4px)]" />
      <div className="relative mx-auto w-full max-w-4xl">
        {eyebrow ? (
          <p className="mb-4 text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/70">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-tight text-stone-100 sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400 sm:text-xl">
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-10 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}
