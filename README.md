# FlowView

See every automation in your stack. Find what's broken before your customers do.

FlowView connects to your martech tools (ActiveCampaign, Zapier, Stripe), builds a
unified flow graph, audits it for failure modes, and lets you replay any contact's
journey across your entire stack.

## Local Development Setup

### Prerequisites

- Node.js 20.9+
- npm
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/kyletowner/flowview.git
cd flowview
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (from Settings > API)

### 3. Set up the database

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the landing page form)
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT WITH CHECK (true);
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (Postgres + Auth + RLS)
- **Integrations:** Nango Cloud (OAuth for AC, Zapier, Stripe)
- **Visualization:** React Flow
- **AI:** Claude API (audit summaries)
- **Jobs:** Trigger.dev
- **Hosting:** Vercel
- **Email:** Resend
- **Analytics:** PostHog

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for full architecture documentation.
