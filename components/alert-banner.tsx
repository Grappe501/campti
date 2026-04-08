import type { ReactNode } from "react";

type Variant = "success" | "warning" | "error" | "info";

const styles: Record<Variant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-950",
};

type Props = {
  variant: Variant;
  children: ReactNode;
  role?: "status" | "alert";
};

export function AlertBanner({ variant, children, role = "status" }: Props) {
  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}
      role={role}
    >
      {children}
    </p>
  );
}
