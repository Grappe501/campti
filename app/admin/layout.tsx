import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <AdminNav />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex-1 px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
