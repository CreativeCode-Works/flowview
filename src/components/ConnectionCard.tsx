"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNangoClient } from "@/lib/nango";
import { saveConnection, removeConnection } from "@/app/(dashboard)/connections/actions";
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
  accountId,
}: ConnectionCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isConnected = status === "active";

  async function handleConnect() {
    setIsPending(true);
    setError(null);

    try {
      // Get a connect session token from our server
      const sessionRes = await fetch("/api/nango/session", { method: "POST" });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error);

      const nango = createNangoClient(sessionData.token);
      const connectionId = `${accountId}-${platform}`;
      const result = await nango.auth(platform, connectionId);

      if (result) {
        const saveResult = await saveConnection(
          accountId,
          platform,
          connectionId
        );
        if (!saveResult.success) {
          setError(saveResult.error);
        }
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect"
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleDisconnect() {
    setIsPending(true);
    setError(null);

    try {
      const result = await removeConnection(accountId, platform);
      if (!result.success) {
        setError(result.error);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect"
      );
    } finally {
      setIsPending(false);
    }
  }

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

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isPending}
        className={`h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          isConnected
            ? "border border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400"
            : "bg-blue-600 text-white hover:bg-blue-500"
        }`}
      >
        {isPending
          ? "..."
          : isConnected
            ? "Disconnect"
            : "Connect"}
      </button>
    </div>
  );
}
