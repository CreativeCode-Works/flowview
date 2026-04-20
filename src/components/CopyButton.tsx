"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
