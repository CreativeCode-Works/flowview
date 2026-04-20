"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/connections", label: "Connections" },
  { href: "/graph", label: "Flow Graph" },
  { href: "/audit", label: "Audit" },
  { href: "/replay", label: "Journey Replay" },
  { href: "/settings", label: "Settings" },
];

export function DashboardNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-6">
      <Link href="/connections" className="mb-8 px-3">
        <span className="text-lg font-bold text-white">FlowView</span>
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <p className="truncate px-3 text-xs text-zinc-500">{userEmail}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
