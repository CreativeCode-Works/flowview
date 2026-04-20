"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton({ accountId }: { accountId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setIsSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();

      if (res.ok) {
        const platforms = Object.entries(data.results ?? {})
          .map(
            ([p, r]) =>
              `${p}: ${(r as { nodes: number }).nodes} nodes, ${(r as { events: number }).events} events`
          )
          .join("; ");
        setResult(platforms || "Sync complete");
        router.refresh();
      } else {
        setResult(data.error ?? "Sync failed");
      }
    } catch {
      setResult("Sync failed — check console for details");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
      >
        {isSyncing ? "Syncing..." : "Sync All Data"}
      </button>
      {result && (
        <p className="mt-2 text-xs text-zinc-400">{result}</p>
      )}
    </div>
  );
}
