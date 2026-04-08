import { StatusBadge } from "@/components/status-badge";

type RecordMetaBadgesProps = {
  visibility: string;
  recordType: string;
};

export function RecordMetaBadges({
  visibility,
  recordType,
}: RecordMetaBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge label={visibility} />
      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
        {recordType.replaceAll("_", " ")}
      </span>
    </div>
  );
}
