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
