type AdminFormErrorProps = {
  error?: string | string[];
};

export function AdminFormError({ error }: AdminFormErrorProps) {
  const code = Array.isArray(error) ? error[0] : error;
  if (code !== "validation") return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      Please check your input and try again. Required fields must be filled; numbers
      must be valid.
    </p>
  );
}
