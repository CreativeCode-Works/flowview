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
