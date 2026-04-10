import { AdminLoginForm } from "./admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = sp.next?.trim() || "/admin/dashboard";
  return <AdminLoginForm nextPath={nextPath} />;
}
