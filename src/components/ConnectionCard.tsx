"use client";

import type { Platform } from "@/types/unified";

interface ConnectionCardProps {
  platform: Platform;
  displayName: string;
  description: string;
  status: string | null;
  lastSyncedAt: string | null;
  accountId: string;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  activecampaign: "bg-blue-600",
  zapier: "bg-orange-500",
  stripe: "bg-purple-600",
};

export function ConnectionCard({
  platform,
  displayName,
  description,
  status,
  lastSyncedAt,
}: ConnectionCardProps) {
  const isConnected = status === "active";

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white ${PLATFORM_COLORS[platform]}`}
        >
          {displayName[0]}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{displayName}</h3>
          {isConnected && (
            <span className="text-xs text-emerald-400">Connected</span>
          )}
        </div>
      </div>

      <p className="mb-4 flex-1 text-xs leading-relaxed text-zinc-400">
        {description}
      </p>

      {lastSyncedAt && (
        <p className="mb-3 text-xs text-zinc-500">
          Last synced:{" "}
          {new Date(lastSyncedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      <button
        className={`h-9 rounded-lg text-sm font-medium transition-colors ${
          isConnected
            ? "border border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400"
            : "bg-blue-600 text-white hover:bg-blue-500"
        }`}
      >
        {isConnected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}
