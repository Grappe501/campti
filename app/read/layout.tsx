import type { Metadata } from "next";
import { ReadCockpitFrame } from "@/components/read/read-cockpit-frame";

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
  return <ReadCockpitFrame>{children}</ReadCockpitFrame>;
}
