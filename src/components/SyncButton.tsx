"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SYNC_STEPS = [
  "Connecting to platforms...",
  "Fetching automations and tags...",
  "Pulling contact data...",
  "Syncing event history...",
  "Processing products and subscriptions...",
  "Normalizing data...",
  "Almost done...",
];

export function SyncButton({ accountId }: { accountId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const router = useRouter();

  // Cycle through steps while syncing
  useEffect(() => {
    if (!isSyncing) return;
    const interval = setInterval(() => {
      setStepIndex((prev) =>
        prev < SYNC_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  async function handleSync() {
    setIsSyncing(true);
    setStepIndex(0);
    setResult(null);

    try {
      const platforms = ["activecampaign", "stripe"];
      const details: string[] = [];
      let totalNodes = 0;
      let totalContacts = 0;
      let totalEvents = 0;
      let hadError = false;

      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        setStepIndex(i * 3); // Jump progress for each platform

        try {
          const res = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId, platform }),
          });
          const data = await res.json();

          if (res.ok && data.results?.[platform]) {
            const r = data.results[platform] as {
              nodes: number;
              contacts: number;
              events: number;
              errors: string[];
            };
            totalNodes += r.nodes;
            totalContacts += r.contacts;
            totalEvents += r.events;
            details.push(
              `${platform}: ${r.nodes} nodes, ${r.contacts} contacts, ${r.events} events`
            );
            if (r.errors.length > 0) {
              details.push(`${platform}: ${r.errors.length} error(s)`);
            }
          } else {
            details.push(`${platform}: ${data.error ?? "failed"}`);
            hadError = true;
          }
        } catch {
          details.push(`${platform}: timed out or failed`);
          hadError = true;
        }
      }

      setResult({
        success: !hadError || totalNodes > 0,
        message: totalNodes > 0 || totalContacts > 0
          ? `Synced ${totalNodes} nodes, ${totalContacts} contacts, and ${totalEvents} events`
          : "Sync failed for all platforms",
        details,
      });
      router.refresh();
    } catch {
      setResult({
        success: false,
        message: "Sync failed — check console for details",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
      >
        {isSyncing ? "Syncing..." : "Sync All Data"}
      </button>

      {/* Sync overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="mb-6 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold text-white">
              Syncing your data
            </h3>
            <p className="mb-4 text-center text-sm text-zinc-400">
              {SYNC_STEPS[stepIndex]}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                style={{
                  width: `${((stepIndex + 1) / SYNC_STEPS.length) * 100}%`,
                }}
              />
            </div>
            <p className="mt-3 text-center text-xs text-zinc-600">
              This may take a minute for large accounts
            </p>
          </div>
        </div>
      )}

      {/* Result toast */}
      {result && !isSyncing && (
        <div className="fixed bottom-6 right-6 z-50 w-96 rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <h4
              className={`text-sm font-semibold ${result.success ? "text-emerald-400" : "text-red-400"}`}
            >
              {result.success ? "Sync Complete" : "Sync Failed"}
            </h4>
            <button
              onClick={() => setResult(null)}
              className="text-zinc-500 hover:text-white"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-zinc-300">{result.message}</p>
          {result.details && result.details.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.details.map((d, i) => (
                <p key={i} className="text-xs text-zinc-500">
                  {d}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
