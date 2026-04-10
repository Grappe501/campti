"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={loading}
      className="w-full rounded-md px-2 py-1.5 text-left text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
