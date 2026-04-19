"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/app/actions";

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(joinWaitlist, {
    success: false,
    error: null,
  });

  if (state.success) {
    return (
      <p className="text-sm font-medium text-emerald-400">
        You&apos;re on the list. We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="you@company.com"
        className="h-12 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-lg bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {isPending ? "Joining..." : "Get Early Access"}
      </button>
      {state.error && (
        <p className="text-sm text-red-400 sm:absolute sm:mt-14">
          {state.error}
        </p>
      )}
    </form>
  );
}
