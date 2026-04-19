# FlowView — CLAUDE.md

This is the persistent reference for every Claude Code session on this project.
Read this file first. Follow it strictly.

## Product Overview

FlowView is an observability tool for martech automation stacks. It connects to a user's
tools (ActiveCampaign, Zapier, Stripe to start), builds a unified visual flow graph, runs
deterministic + AI-powered audits, and provides per-contact Journey Replay.

We are NOT an automation builder, NOT an iPaaS, NOT a Zapier competitor.
We are the single pane of glass that shows everything, together, per contact.

Domain: flowview.dev

## GitHub & Git Config

- **Repo:** `CreativeCode-Works/flowview` (public)
- **GitHub account:** `CreativeCode-Works` — must be the active `gh` account when pushing.
  Switch with `gh auth switch` if needed. Do NOT push under `escoaching`.
- **Git identity (repo-level):** Kyle Towner <kyle@creativecode.works>
  Already configured via `git config user.name` / `git config user.email` (not global).
- **Protocol:** HTTPS

## Phase 1 Scope (90 days from 2026-04-19)

**In scope:**
- OAuth connections to ActiveCampaign, Zapier, Stripe (via Nango Cloud)
- Pull automations, zaps, tags, products, subscriptions, webhooks, contact-level events
- Unified flow graph (React Flow)
- ~20 deterministic audit rules + Claude summary pass
- Journey Replay: pick any contact, see timeline + highlighted path on graph
- PDF audit report export (lead magnet)
- Pricing page with Stripe checkout
- Supabase Auth (email/password)

**Explicitly OUT of scope:**
- Automation building/editing
- More than 3 integrations
- SOC 2 compliance (year 2)
- Mobile app
- Team/org features
- Custom branding
- Real-time sync (we do periodic batch sync)

## Tech Stack

| Tool | Why |
|------|-----|
| Next.js 16 (App Router) | Full-stack React, server components, Vercel deploy |
| TypeScript (strict) | Catch bugs at compile time |
| Tailwind CSS + shadcn/ui | Fast UI without custom CSS |
| Supabase (Postgres + Auth + RLS) | Auth + DB in one, generous free tier |
| Nango Cloud | OAuth token management — never roll our own |
| React Flow | Flow graph visualization |
| Claude API (sonnet for parsing, opus for reasoning) | AI audit summaries |
| Trigger.dev | Long-running sync + audit jobs |
| Vercel | Hosting, zero-config deploys |
| Resend | Transactional email |
| PostHog | Product analytics |

## Next.js 16 Breaking Changes (IMPORTANT)

This project runs Next.js 16. Key differences from 14/15:

- **Async request APIs**: `cookies()`, `headers()`, `draftMode()` must be `await`ed
- **Params are Promises**: `params` and `searchParams` in pages/layouts are `Promise` types — must be awaited before destructuring
- **Middleware renamed to Proxy**: Use `proxy.ts` with a named `proxy` export (not `middleware.ts`)
- **Turbopack is default**: No `--turbopack` flag needed
- **No `next lint`**: Use ESLint directly
- **React 19.2+**: View Transitions, `useEffectEvent`, Activity components available
- **`images.domains` deprecated**: Use `images.remotePatterns` instead

## Coding Conventions

- TypeScript strict mode — zero `any` types. Use `unknown` + type narrowing.
- Server components by default. `"use client"` only when interactivity requires it.
- Functional components only. No classes.
- Max file size ~200 lines. Split if larger.
- Named exports (not default) except for page/layout components.
- Use `@/*` import alias for all project imports.
- Prefer `const` over `let`. Never use `var`.
- No barrel files (index.ts re-exports). Import from the actual file.
- Error handling: fail loud in dev, graceful + structured logging in prod.

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/                # API routes
│   ├── (auth)/             # Auth route group (login, signup)
│   ├── (dashboard)/        # Dashboard route group (protected)
│   └── page.tsx            # Landing page
├── components/             # Shared React components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Feature components
├── lib/                    # Shared utilities
│   ├── supabase/           # Supabase client helpers
│   ├── env.ts              # Typed environment variables
│   └── ...
├── integrations/           # Platform integrations
│   ├── registry.ts         # Integration registry
│   └── {platform}/         # One folder per platform
│       ├── client.ts       # Typed API client
│       ├── types.ts        # Platform-specific types
│       ├── sync-config.ts  # Pull automations, tags, products, etc.
│       ├── sync-events.ts  # Pull contact-level event history (90 days)
│       └── normalize.ts    # Map to unified schema
├── audit-rules/            # Audit rule functions
│   ├── registry.ts         # Rule registry
│   └── {rule-name}.ts      # One file per rule
├── types/                  # Shared TypeScript types
│   ├── unified.ts          # Unified schema (contacts, events, nodes)
│   └── ...
docs/
├── LEARNINGS.md            # Living engineering journal
```

## File Naming Rules

- Components: `PascalCase.tsx` (e.g., `FlowGraph.tsx`)
- Everything else: `kebab-case.ts` (e.g., `sync-config.ts`)
- Types files: `kebab-case.ts` in `/types` or colocated as `types.ts`
- Test files: `*.test.ts` colocated with source

## Integration Pattern

Every integration lives at `/src/integrations/{platform}/` with these files:

1. **`types.ts`** — Platform-specific types (API responses, configs)
2. **`client.ts`** — Typed API client (all external calls go through here)
3. **`sync-config.ts`** — Pull automations, tags, products, webhooks, etc.
4. **`sync-events.ts`** — Pull contact-level event history (last 90 days for v1)
5. **`normalize.ts`** — Map platform data to unified schema

### Checklist for Adding a New Integration

- [ ] Create `/src/integrations/{platform}/` folder
- [ ] Implement all 5 files above
- [ ] Register in `/src/integrations/registry.ts`
- [ ] Add platform to the `Platform` union type in `/src/types/unified.ts`
- [ ] Add Nango connection config
- [ ] Write integration tests for normalize.ts
- [ ] Add entry to LEARNINGS.md with any API quirks discovered

## Audit Rule Pattern

Every audit rule is a pure function at `/src/audit-rules/{rule-name}.ts`:

```typescript
export const metadata = {
  id: "missing-tag-handler",
  name: "Missing Tag Handler",
  severity: "warning" | "error" | "info",
  category: "tag-hygiene" | "webhook-reliability" | "flow-integrity" | ...,
  explanation: "Template string describing the finding",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  // Pure function. No side effects. No external calls.
  // Returns array of findings (empty = rule passed).
}
```

### Checklist for Adding a New Audit Rule

- [ ] Create `/src/audit-rules/{rule-name}.ts`
- [ ] Export `metadata` and `evaluate` function
- [ ] Register in `/src/audit-rules/registry.ts`
- [ ] Rule must be a pure function — no side effects, no API calls
- [ ] Write test for the rule with sample data

## Contact Resolution Philosophy

**Email is primary key.** Fuzzy match on name+phone as fallback.

**NEVER silently merge contacts.** Real customers have fragmented identities —
same person, different emails across tools. We surface identity fragmentation
as its own audit finding:

> "These 3 contacts appear to be the same person across AC/Stripe/Zapier"

The user decides whether to treat them as one. We show the evidence.
Build this principle into every contact-related query from day one.

## Events Table Design

The `events` table is the largest table in the DB. Design for millions of rows.

```sql
-- Schema (partitioned by month)
CREATE TABLE events (
  id              UUID DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES contacts(id),
  platform        TEXT NOT NULL,  -- 'activecampaign' | 'zapier' | 'stripe'
  event_type      TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  source_node_id  UUID,           -- links to the flow graph node
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);
```

- Partition by month from the start
- Index on `(contact_id, timestamp)` and `(platform, timestamp)`
- Do NOT store raw API responses long-term — normalize into this schema
- `metadata` JSONB for platform-specific fields that don't fit the schema

## Compliance Notes (Not MVP Blockers)

Before first paying customer:
- Privacy policy
- DPA template
- Data deletion endpoint
- Regional data residency plan

SOC 2 is year 2. Track in roadmap, not sprint.

## Environment Variables

Required env vars (see `.env.example` for template):

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anonymous/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server only)
```

Future additions: Nango, Anthropic, Trigger.dev, Resend, PostHog keys.

## How to Start a Session

1. Read this file (CLAUDE.md)
2. Scan `/docs/LEARNINGS.md` for entries relevant to the current task
3. Check git log for recent changes
4. Ask clarifying questions before writing code
