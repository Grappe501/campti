import { AdminNav } from "@/components/admin-nav";
import { AdminPageAgentPanel } from "@/components/admin-page-agent-panel";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showSignOut = Boolean(process.env.CAMPTI_ADMIN_PASSWORD?.trim());

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <AdminNav showSignOut={showSignOut} />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex-1 px-6 py-8">{children}</div>
      </div>
      <AdminPageAgentPanel />
    </div>
  );
}
