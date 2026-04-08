import { ReadNav } from "@/components/read-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Read — Campti",
  description:
    "Enter the narrative: chapters, scenes, people, and places in a living historical world.",
  openGraph: {
    title: "Read — Campti",
    description: "A literary reading room for a multi-generational story world.",
  },
};

export default function ReadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0e0c] text-stone-200">
      <ReadNav />
      <div className="flex-1 px-6 py-12 sm:px-10 lg:px-12">{children}</div>
    </div>
  );
}
