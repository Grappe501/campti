/**
 * Seeds `EpicBook` spine rows from `docs/build/master-build-spine.md` §6 (Epic narrative spine).
 * Books 1–4 are calibrated arcs; 5–11 are provisional placeholders for the long sweep.
 */
import { prisma } from "../lib/prisma";

const SPINE_META = {
  sourceDoc: "docs/build/master-build-spine.md",
  section: "§6 Epic narrative spine (initial)",
} as const;

const SHARED_THEMES = [
  "marriage and union as transmission of power",
  "power through union across worlds",
  "matriarchal continuity",
  "restoration over mere decay",
] as const;

export async function seedEpicBookSpine(): Promise<void> {
  const books: Array<{
    id: string;
    orderIndex: number;
    title: string;
    summary: string;
    themes: string[];
    isProvisional: boolean;
  }> = [
    {
      id: "epic-book-spine-01",
      orderIndex: 1,
      title: "Book 1 — Pre-contact through La Salle arrival",
      summary: "Pre-contact world through La Salle arrival",
      themes: [...SHARED_THEMES, "pre-contact", "La Salle", "arrival"],
      isProvisional: false,
    },
    {
      id: "epic-book-spine-02",
      orderIndex: 2,
      title: "Book 2 — Contact deepens; French foothold",
      summary: "Contact deepens; raid on Natchitoches village; French foothold",
      themes: [...SHARED_THEMES, "contact", "Natchitoches", "French foothold"],
      isProvisional: false,
    },
    {
      id: "epic-book-spine-03",
      orderIndex: 3,
      title: "Book 3 — French arrival through birth of François Grappe",
      summary: "French arrival through birth of François Grappe",
      themes: [...SHARED_THEMES, "François Grappe", "French era", "birth threshold"],
      isProvisional: false,
    },
    {
      id: "epic-book-spine-04",
      orderIndex: 4,
      title: "Book 4 — François era to the Civil War threshold",
      summary: "François era into threshold before the Civil War",
      themes: [...SHARED_THEMES, "François era", "Civil War threshold"],
      isProvisional: false,
    },
    {
      id: "epic-book-spine-05",
      orderIndex: 5,
      title: "Book 5 — Civil War (provisional)",
      summary: "Provisional sweep: Civil War era (calibration pending).",
      themes: [...SHARED_THEMES, "Civil War"],
      isProvisional: true,
    },
    {
      id: "epic-book-spine-06",
      orderIndex: 6,
      title: "Book 6 — Reconstruction / Jim Crow (provisional)",
      summary: "Provisional sweep: Reconstruction / Jim Crow (calibration pending).",
      themes: [...SHARED_THEMES, "Reconstruction", "Jim Crow"],
      isProvisional: true,
    },
    {
      id: "epic-book-spine-07",
      orderIndex: 7,
      title: "Book 7 — Identity suppression and diaspora (provisional)",
      summary: "Provisional sweep: identity suppression and diaspora (calibration pending).",
      themes: [...SHARED_THEMES, "diaspora", "identity"],
      isProvisional: true,
    },
    {
      id: "epic-book-spine-08",
      orderIndex: 8,
      title: "Book 8 — Modern fragmentation (provisional)",
      summary: "Provisional sweep: modern fragmentation (calibration pending).",
      themes: [...SHARED_THEMES, "modernity", "fragmentation"],
      isProvisional: true,
    },
    {
      id: "epic-book-spine-09",
      orderIndex: 9,
      title: "Book 9 — Death of the last matriarch (2010) (provisional)",
      summary: "Provisional sweep: death of the last matriarch (2010) (calibration pending).",
      themes: [...SHARED_THEMES, "matriarch", "2010"],
      isProvisional: true,
    },
    {
      id: "epic-book-spine-10",
      orderIndex: 10,
      title: "Book 10 — Restoration / rediscovery (provisional)",
      summary: "Provisional sweep: restoration / rediscovery (calibration pending).",
      themes: [...SHARED_THEMES, "restoration", "rediscovery"],
      isProvisional: true,
    },
    {
      id: "epic-book-spine-11",
      orderIndex: 11,
      title: "Book 11 — Arkansas public leadership (provisional)",
      summary: "Provisional sweep: rise into Arkansas public leadership (calibration pending).",
      themes: [...SHARED_THEMES, "public leadership", "Arkansas"],
      isProvisional: true,
    },
  ];

  for (const b of books) {
    await prisma.epicBook.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        orderIndex: b.orderIndex,
        summary: b.summary,
        themes: b.themes,
        isProvisional: b.isProvisional,
        metadataJson: { ...SPINE_META, orderIndex: b.orderIndex },
      },
      create: {
        id: b.id,
        title: b.title,
        orderIndex: b.orderIndex,
        summary: b.summary,
        themes: b.themes,
        isProvisional: b.isProvisional,
        metadataJson: { ...SPINE_META, orderIndex: b.orderIndex },
      },
    });
  }
}
