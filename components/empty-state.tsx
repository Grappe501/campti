type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-center">
      <p className="text-sm font-medium text-stone-800">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-stone-600">{description}</p>
      ) : null}
    </div>
  );
}
