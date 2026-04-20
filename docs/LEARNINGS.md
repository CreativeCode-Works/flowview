# FlowView — Engineering Learnings

Living journal of non-obvious discoveries, tradeoffs, and decisions.
Claude Code should append to this file at the end of every meaningful session.

## Entry Format

```
### YYYY-MM-DD — [Topic]
**Context:** What were we doing?
**Finding:** What did we learn?
**Decision:** What did we decide (and why)?
**Impact:** What does this affect going forward?
```

---

### 2026-04-19 — Project Initialization

**Context:** Setting up the FlowView project from scratch. Chose Next.js, Supabase,
Nango Cloud, Tailwind, shadcn/ui.

**Finding:** Next.js 16 has significant breaking changes from 14/15:
- `cookies()`, `headers()` are now async — must be awaited
- `params` and `searchParams` in pages/layouts are `Promise` types
- Middleware is renamed to Proxy (`proxy.ts` with `proxy` export)
- Turbopack is now the default bundler
- `next lint` removed — use ESLint directly
- `images.domains` deprecated in favor of `images.remotePatterns`

**Decision:** Documented all breaking changes in CLAUDE.md so future sessions don't
write Next.js 14/15-style code. Using `proxy.ts` instead of `middleware.ts`.

**Impact:** Every page/layout that accesses params or searchParams needs to await them.
All middleware patterns from tutorials will need adaptation.

---

### 2026-04-19 — Nango Cloud vs Self-Hosted

**Context:** Evaluating whether to self-host Nango or use their Cloud free tier.

**Finding:** Nango Cloud free tier supports exactly 3 integrations — matches our
Phase 1 needs (AC, Zapier, Stripe). Self-hosting requires VPS + Postgres + Redis + Docker.

**Decision:** Start with Nango Cloud. Revisit if we add >3 integrations or hit
rate/volume limits. Decision is easily reversible.

**Impact:** No infrastructure to manage for OAuth. Simplifies Phase 1 ops.

---

### 2026-04-19 — ActiveCampaign API Quirks

**Context:** Researching AC API v3 to build typed client and integration scaffold.

**Finding:** Several non-obvious behaviors:
1. Nearly all values returned as strings, including numbers and booleans (`"1"` not `1`)
2. Rate limit is 5 req/s per account — need built-in throttling
3. Automation list endpoint does NOT expose trigger/action structure — only name, status, counts. The `blocks` link is internal and undocumented.
4. Tags are NOT embedded in contact responses — must sideload with `?include=contactTags.tag` or fetch separately
5. Contact pagination: offset-based (`limit`/`offset`), max 100 per page. For deep pagination, use `id_greater` instead of offset for better performance.
6. Base URL varies by region — NOT always `api-us1.com`. Must store per-account.
7. AC uses API key auth (`Api-Token` header), not OAuth. Nango may still manage the credential but there's no OAuth dance.
8. If webhook endpoint returns HTTP 410, AC permanently deactivates it.

**Decision:** Built rate limiter into client (220ms gap between requests). Type everything as strings and coerce in normalize.ts. Store base URL per connection.

**Impact:** Can't build detailed automation step visualization from AC API alone — we'll show automations as single nodes with entry/exit counts. May need to explore the undocumented blocks endpoint later if we want step-level detail.

---

### 2026-04-19 — GitHub Account Setup

**Context:** Initially pushed repo to wrong GitHub account (escoaching instead of CreativeCode-Works).

**Finding:** `gh auth` supports multiple accounts. Can switch with `gh auth switch`.

**Decision:** Set repo-level git config for identity (`Kyle Towner <kyle@creativecode.works>`), keeping global config separate for work account. Both gh accounts stay authenticated.

**Impact:** Must verify active `gh` account before creating repos or pushing. CLAUDE.md documents this.

---

### 2026-04-19 — Zapier API Limitations

**Context:** Researching Zapier API to build integration for reading Zap configurations and run history.

**Finding:** Major limitations:
1. Requires a published Zapier integration (Partner API) — no personal access token
2. Zap run/task history API is experimental and NOT publicly available
3. `get_params` only returns params for steps belonging to YOUR app, not third-party steps
4. v1 uses integer IDs, v2 uses UUIDs — we use v2
5. `last_successful_run_date` on the Zap object is the only run proxy signal
6. Rate limit: 150 req/min

**Decision:** Built Zapier integration around what's available: Zap listing with step metadata, state tracking. Using `last_successful_run_date` as a lightweight proxy for run events. The missing run history will be surfaced as an audit finding — "Zapier run history unavailable for detailed analysis."

**Impact:** Zapier will be the thinnest integration. Flow graph will show Zaps as nodes with connected apps, but can't show per-contact Zap runs. This is a known limitation to communicate to users.

---

### 2026-04-19 — Stripe Events API 30-Day Limit

**Context:** Building Stripe integration for event history sync.

**Finding:** Stripe's `/v1/events` endpoint only retains events for 30 days, not the 90 days we planned. To get longer history, we'd need to capture events in real-time via webhooks and store them ourselves.

**Decision:** For v1, sync the 30 days available via the API. Also pull charges, subscriptions, and invoices directly (these are retained indefinitely) to reconstruct a fuller history. Add webhook listener as a follow-up task for real-time event capture.

**Impact:** Initial Stripe event history will be limited to 30 days. Charges/subscriptions/invoices fill the gap for financial events. Real-time webhook capture should be prioritized for week 7.

---

### 2026-04-19 — Zapier Integration: Public Required for Zap Reading API

**Context:** Attempting to connect Zapier through Nango and read users' Zap configurations.

**Finding:** Major discovery — Zapier's Partner API OAuth credentials (Client ID / Client Secret) are ONLY available after publishing a public integration through Zapier's review process. Private integrations cannot access the Partner API at all. There is no personal API key or alternative path.

**Decision:** Built FlowView as a Zapier integration (Auth + Trigger + Action) in the Zapier developer portal. This gives us:
1. API key auth working (tested successfully)
2. "New Audit Finding" trigger (polling, tested)
3. "Log Zap Event" action (receives contact data from user's zaps)
Once we go public, we get OAuth credentials to also READ users' zaps via the Partner API.

**Impact:** Dual approach — the Action lets users push zap run data to FlowView NOW (no approval needed). Going public unlocks the read API for auto-discovering zap configurations. Submit for public review ASAP.

---

### 2026-04-19 — Nango Connect Session Tokens (No Public Key)

**Context:** Setting up Nango OAuth flow for connecting integrations.

**Finding:** Nango no longer exposes public keys. The frontend SDK now requires a Connect Session Token, generated server-side using the secret key.

**Decision:** Built POST /api/nango/session endpoint that creates a short-lived token, passed to the frontend Nango SDK for OAuth popups.

**Impact:** All Nango auth flows go through our server first. No public key in env vars.

---

### 2026-04-19 — Vercel Deployment Issues

**Context:** Deploying FlowView to Vercel with custom domain flowview.dev.

**Finding:** Multiple issues encountered:
1. Framework Preset defaulted to "Other" instead of "Next.js" — caused 404 on all routes
2. Vercel Hobby plan applies auth to deploy URLs (*.vercel.app) — custom domain bypasses this
3. Supabase RLS was missing INSERT policy on accounts table — caused server error on connections page
4. DNS A record needed updating from 76.76.21.21 to 216.198.79.1 (Vercel's new IP)

**Decision:** Fixed all issues. Key lesson: always verify Framework Preset is set correctly when creating Vercel projects via CLI.

**Impact:** Deployment pipeline is now working: git push → Vercel auto-deploy → flowview.dev live.
