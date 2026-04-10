"use client";

import { useState } from "react";

export function CopyPromptButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:border-amber-300 hover:bg-amber-50"
    >
      {done ? "Copied" : label}
    </button>
  );
}
