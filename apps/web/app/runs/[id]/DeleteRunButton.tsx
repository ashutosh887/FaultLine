"use client";

import { useRouter } from "next/navigation";

export function DeleteRunButton({ traceId }: { traceId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this trace? This cannot be undone.")) return;
    const res = await fetch(`/api/runs/${traceId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/runs");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/50"
    >
      Delete
    </button>
  );
}
