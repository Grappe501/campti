import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default function RelationshipNetworksHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/admin/relationships" className="text-sm text-amber-900 hover:underline">
        ← Relationships
      </Link>
      <PageHeader
        title="Network summaries"
        description="Per-character, per–world-state summaries are edited under each person: Relationships (Stage 6). No graph UI in this stage."
      />
      <p className="text-sm text-stone-700">
        Open <Link href="/admin/people" className="text-amber-900 hover:underline">People</Link>, choose a character, then{" "}
        <strong>Relationships (Stage 6)</strong> to edit masking, desire, network JSON, and dyads.
      </p>
    </div>
  );
}
