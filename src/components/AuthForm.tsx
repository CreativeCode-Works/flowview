"use client";

import { useActionState } from "react";
import { login, signup } from "@/app/(auth)/actions";

function FormFields({
  action,
  buttonText,
  isPending,
  error,
}: {
  action: (payload: FormData) => void;
  buttonText: string;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Min 8 characters"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {isPending ? "..." : buttonText}
      </button>
    </form>
  );
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, {
    error: null,
  });

  return (
    <FormFields
      action={formAction}
      buttonText="Log in"
      isPending={isPending}
      error={state.error}
    />
  );
}

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, {
    error: null,
  });

  return (
    <FormFields
      action={formAction}
      buttonText="Create account"
      isPending={isPending}
      error={state.error}
    />
  );
}
