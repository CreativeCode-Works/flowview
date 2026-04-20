"use client";

import { useState } from "react";
import { ContactTimeline } from "./ContactTimeline";

interface SearchContact {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  platform_ids: Record<string, string | null>;
  tags: string[];
  first_seen_at: string | null;
  last_seen_at: string | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  activecampaign: "bg-blue-600",
  zapier: "bg-orange-500",
  stripe: "bg-purple-600",
};

export function ContactSearch({ accountId }: { accountId: string }) {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<SearchContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<SearchContact | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/replay/search?q=${encodeURIComponent(query)}&accountId=${accountId}`
      );
      const data = await res.json();
      setContacts(data.contacts);
      setSelectedContact(null);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name..."
          className="h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {isSearching ? "..." : "Search"}
        </button>
      </form>

      {/* Search results */}
      {contacts.length > 0 && !selectedContact && (
        <div className="mb-6 space-y-2">
          <p className="text-xs text-zinc-500">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} found
          </p>
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {contact.email ?? "No email"}
                </p>
                {contact.name && (
                  <p className="text-xs text-zinc-400">{contact.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {Object.entries(contact.platform_ids)
                  .filter(([, id]) => id)
                  .map(([platform]) => (
                    <span
                      key={platform}
                      className={`h-2 w-2 rounded-full ${PLATFORM_COLORS[platform] ?? "bg-zinc-600"}`}
                      title={platform}
                    />
                  ))}
                {contact.last_seen_at && (
                  <span className="text-xs text-zinc-500">
                    Last seen{" "}
                    {new Date(contact.last_seen_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected contact timeline */}
      {selectedContact && (
        <div>
          <button
            onClick={() => setSelectedContact(null)}
            className="mb-4 text-sm text-blue-400 hover:text-blue-300"
          >
            &larr; Back to results
          </button>
          <ContactTimeline
            contact={selectedContact}
            accountId={accountId}
          />
        </div>
      )}

      {/* Empty state */}
      {contacts.length === 0 && query && !isSearching && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">
            No contacts found matching &quot;{query}&quot;
          </p>
        </div>
      )}

      {/* Initial state */}
      {!query && contacts.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">
            Enter an email or name to find a contact and replay their journey.
          </p>
        </div>
      )}
    </div>
  );
}
