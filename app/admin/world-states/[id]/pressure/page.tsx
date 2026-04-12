import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getWorldPressureBundleForAdmin, getWorldStateById } from "@/lib/data-access";
import { getWorldGovernanceProfile } from "@/lib/pressure-order";
import { profileJsonFieldToFormText } from "@/lib/profile-json";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WorldStatePressurePage({ params }: Props) {
  const { id } = await params;
  const ws = await getWorldStateById(id);
  if (!ws) notFound();

  const [gov, bundle] = await Promise.all([getWorldGovernanceProfile(id), getWorldPressureBundleForAdmin(id)]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link href="/admin/world-states" className="text-amber-900 hover:underline">
            ← World states
          </Link>
          <Link href={`/admin/world-states/${ws.id}/profile`} className="text-amber-900 hover:underline">
            Era profile
          </Link>
          <Link href={`/admin/world-states/${ws.id}/knowledge`} className="text-amber-900 hover:underline">
            Knowledge horizon (5.5) →
          </Link>
        </div>
        <PageHeader title={`Pressure · ${ws.eraId}`} description={ws.label} />
        <p className="mt-2 text-sm text-stone-600">{ws.description ?? "—"}</p>
        <p className="mt-1 text-xs text-stone-500">
          World state id: <code className="break-all">{ws.id}</code>
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Governance profile</h2>
        {gov ? (
          <div className="mt-3 space-y-2 text-sm text-stone-700">
            <p>
              <span className="font-medium">{gov.label}</span> · justice {gov.justiceMode} · control {gov.controlIntensity}{" "}
              · conformity {gov.conformityPressure}
            </p>
            <p>
              <Link href={`/admin/pressure/governance/${gov.id}`} className="text-amber-900 hover:underline">
                Edit governance profile →
              </Link>
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            None yet.{" "}
            <Link
              href={`/admin/pressure/governance/new?worldStateId=${encodeURIComponent(ws.id)}`}
              className="text-amber-900 hover:underline"
            >
              Create governance profile
            </Link>
          </p>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">World pressure bundle</h2>
        <p className="mt-1 text-sm text-stone-600">
          Era knobs can tilt these weights at runtime —{" "}
          <Link href={`/admin/world-states/${ws.id}/profile`} className="text-amber-900 hover:underline">
            edit era profile
          </Link>
          .
        </p>
        {bundle ? (
          <div className="mt-3 space-y-2 text-sm text-stone-700">
            <p>
              Weights: gov {bundle.governanceWeight} · econ {bundle.economicWeight} · demo {bundle.demographicWeight} · fam{" "}
              {bundle.familyWeight}
            </p>
            <pre className="max-h-40 overflow-auto rounded bg-stone-50 p-2 text-xs">
              {profileJsonFieldToFormText(bundle.summary)}
            </pre>
            <p>
              <Link href={`/admin/pressure/bundles/${bundle.id}`} className="text-amber-900 hover:underline">
                Edit bundle →
              </Link>
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            None yet.{" "}
            <Link
              href={`/admin/pressure/bundles/new?worldStateId=${encodeURIComponent(ws.id)}`}
              className="text-amber-900 hover:underline"
            >
              Create bundle
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
