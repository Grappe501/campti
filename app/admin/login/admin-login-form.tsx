"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed (${res.status})`);
        return;
      }
      router.push(nextPath.startsWith("/") ? nextPath : "/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <PageHeader
        title="Admin sign-in"
        description="Password is set in CAMPTI_ADMIN_PASSWORD. Session cookie is httpOnly."
      />
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-stone-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900"
            disabled={loading}
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-amber-800 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-stone-500">
        <Link href="/" className="text-amber-900 hover:underline">
          ← Campti home
        </Link>
      </p>
    </div>
  );
}
