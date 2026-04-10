import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default function ContinuityLearningHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/admin/continuity/education" className="text-sm text-amber-900 hover:underline">
        ← Education norms
      </Link>
      <PageHeader
        title="Learning envelope (Stage 6.5)"
        description="Per-character, per–world-state learning envelopes are edited under People → Continuity. This route is a pointer only."
      />
      <p className="text-sm text-stone-700">
        Open <Link href="/admin/people" className="text-amber-900 hover:underline">People</Link>, choose someone, then{" "}
        <strong>Continuity (Stage 6.5)</strong> and expand <em>Learning envelope</em> for an era.
      </p>
    </div>
  );
}
