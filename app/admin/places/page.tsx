import Link from "next/link";
import {
  PlaceType,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";
import { createPlace } from "@/app/actions/places";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getPlaces } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = {
  visibility?: string;
  recordType?: string;
  placeType?: string;
  error?: string;
};

function parseEnum<T extends string>(
  v: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!v) return undefined;
  return allowed.includes(v as T) ? (v as T) : undefined;
}

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters = {
    visibility: parseEnum(sp.visibility, Object.values(VisibilityStatus)),
    recordType: parseEnum(sp.recordType, Object.values(RecordType)),
    placeType: parseEnum(sp.placeType, Object.values(PlaceType)),
  };
  const places = await getPlaces(filters);

  const filterHref = (next: Partial<Search>) => {
    const merged = { ...sp, ...next };
    const p = new URLSearchParams();
    if (merged.visibility) p.set("visibility", merged.visibility);
    if (merged.recordType) p.set("recordType", merged.recordType);
    if (merged.placeType) p.set("placeType", merged.placeType);
    const q = p.toString();
    return q ? `/admin/places?${q}` : "/admin/places";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Places"
        description="Atlas entries: towns, churches, water, and home ground. Coordinates prepare for future maps."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create place</h2>
        <form action={createPlace} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Place type</span>
              <select name="placeType" className={fieldClass} defaultValue={PlaceType.TOWN}>
                {Object.values(PlaceType).map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={VisibilityStatus.PRIVATE}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={RecordType.HISTORICAL}>
              {Object.values(RecordType).map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Latitude</span>
              <input name="latitude" type="text" inputMode="decimal" className={fieldClass} placeholder="31.0582" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Longitude</span>
              <input name="longitude" type="text" inputMode="decimal" className={fieldClass} placeholder="-93.2185" />
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save place
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All places</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-semibold uppercase text-stone-500">Filters</span>
          <Link href={filterHref({ visibility: undefined, recordType: undefined, placeType: undefined })} className="text-amber-900 hover:underline">
            Clear
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-xs text-stone-500">Visibility:</span>
          {Object.values(VisibilityStatus).map((v) => (
            <Link
              key={v}
              href={filterHref({ visibility: v })}
              className={`rounded-full px-2 py-0.5 ${sp.visibility === v ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
            >
              {v}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-xs text-stone-500">Place type:</span>
          {Object.values(PlaceType).map((t) => (
            <Link
              key={t}
              href={filterHref({ placeType: t })}
              className={`rounded-full px-2 py-0.5 ${sp.placeType === t ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
            >
              {t.replaceAll("_", " ")}
            </Link>
          ))}
        </div>
        {places.length === 0 ? (
          <EmptyState title="No places match." />
        ) : (
          <AdminTable
            rows={places}
            rowKey={(pl) => pl.id}
            columns={[
              {
                key: "name",
                header: "Name",
                cell: (pl) => (
                  <Link href={`/admin/places/${pl.id}`} className="font-medium text-amber-900 hover:underline">
                    {pl.name}
                  </Link>
                ),
              },
              {
                key: "type",
                header: "Type",
                cell: (pl) => pl.placeType.replaceAll("_", " "),
              },
              {
                key: "meta",
                header: "Visibility / record",
                cell: (pl) => <RecordMetaBadges visibility={pl.visibility} recordType={pl.recordType} />,
              },
              {
                key: "coords",
                header: "Coords",
                className: "tabular-nums text-stone-600 text-xs",
                cell: (pl) =>
                  pl.latitude != null && pl.longitude != null
                    ? `${pl.latitude.toFixed(4)}, ${pl.longitude.toFixed(4)}`
                    : "—",
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
