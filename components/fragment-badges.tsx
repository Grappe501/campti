import { FragmentType } from "@prisma/client";
import { fragmentTypeLabel } from "@/lib/fragment-types";

export function FragmentTypeBadge({ type }: { type: FragmentType }) {
  return (
    <span className="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-800 ring-1 ring-stone-200">
      {fragmentTypeLabel(type)}
    </span>
  );
}

export function PlacementBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "—";
  return (
    <span className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 text-xs text-sky-900 ring-1 ring-sky-200">
      {s}
    </span>
  );
}

export function CandidateStatusBadge({ status }: { status: string }) {
  const tone =
    status === "accepted"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : status === "rejected"
        ? "bg-rose-50 text-rose-900 ring-rose-200"
        : status === "deferred"
          ? "bg-amber-50 text-amber-900 ring-amber-200"
          : "bg-stone-50 text-stone-800 ring-stone-200";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs ring-1 ${tone}`}>{status}</span>
  );
}
