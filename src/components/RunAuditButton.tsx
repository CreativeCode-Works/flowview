"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunAuditButton({ accountId }: { accountId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  async function handleRunAudit() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <button
      onClick={handleRunAudit}
      disabled={isRunning}
      className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
    >
      {isRunning ? "Running..." : "Run Audit"}
    </button>
  );
}
