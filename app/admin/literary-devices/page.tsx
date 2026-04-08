import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getLiteraryDevicesList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminLiteraryDevicesPage() {
  const devices = await getLiteraryDevicesList();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Literary devices" description="Devices and their system effects on pacing and revelation." />
      <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {devices.length === 0 ? (
          <li className="text-sm text-stone-600">No devices yet.</li>
        ) : (
          devices.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/literary-devices/${d.id}`} className="text-amber-900 hover:underline">
                {d.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
