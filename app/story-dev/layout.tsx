/**
 * Story-dev uses its own surface: the global app body is light paper/ink
 * (--campti-paper / --campti-ink). Without this wrapper, stone-* Tailwind
 * tokens sat on cream and read as "light on light."
 */
export default function StoryDevLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full w-full flex-1 bg-zinc-950 text-zinc-100 selection:bg-amber-500/35 selection:text-white">
      {children}
    </div>
  );
}
