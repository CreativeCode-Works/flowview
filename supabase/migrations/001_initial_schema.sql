-- FlowView: Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- WAITLIST (already created if you followed README)
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ACCOUNTS (one per paying customer / org)
-- ============================================================
CREATE TABLE accounts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own account" ON accounts
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update own account" ON accounts
  FOR UPDATE USING (owner_id = auth.uid());

-- ============================================================
-- CONNECTIONS (OAuth connections via Nango)
-- ============================================================
CREATE TABLE connections (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('activecampaign', 'zapier', 'stripe')),
  nango_connection_id TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_synced_at  TIMESTAMPTZ,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, platform)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections" ON connections
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- CONTACTS (unified across platforms)
-- ============================================================
CREATE TABLE contacts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email           TEXT,
  name            TEXT,
  phone           TEXT,
  platform_ids    JSONB NOT NULL DEFAULT '{}',
  -- e.g. { "activecampaign": "12345", "stripe": "cus_xxx", "zapier": null }
  tags            TEXT[] DEFAULT '{}',
  first_seen_at   TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(account_id, email);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- IDENTITY CLUSTERS (fragmented identity detection)
-- Never auto-merged. Surfaced as audit findings.
-- ============================================================
CREATE TABLE identity_clusters (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_ids     UUID[] NOT NULL,
  match_reason    TEXT NOT NULL,
  -- e.g. "same phone, different email" or "name fuzzy match (0.92)"
  confidence      REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  resolved        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_identity_clusters_account ON identity_clusters(account_id);

ALTER TABLE identity_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clusters" ON identity_clusters
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- FLOW NODES (automation nodes in the unified graph)
-- ============================================================
CREATE TABLE flow_nodes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('activecampaign', 'zapier', 'stripe')),
  platform_id     TEXT NOT NULL,
  -- ID of this object on the source platform
  node_type       TEXT NOT NULL,
  -- e.g. 'automation', 'zap', 'product', 'tag', 'webhook', 'pipeline_stage'
  name            TEXT NOT NULL,
  status          TEXT,
  -- e.g. 'active', 'inactive', 'draft', 'paused'
  config          JSONB DEFAULT '{}',
  -- platform-specific config blob
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, platform, platform_id)
);

CREATE INDEX idx_flow_nodes_account ON flow_nodes(account_id);
CREATE INDEX idx_flow_nodes_type ON flow_nodes(account_id, node_type);

ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own flow nodes" ON flow_nodes
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- FLOW EDGES (connections between nodes in the graph)
-- ============================================================
CREATE TABLE flow_edges (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source_node_id  UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  target_node_id  UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  edge_type       TEXT NOT NULL,
  -- e.g. 'triggers', 'adds_tag', 'creates_customer', 'webhook_to'
  label           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, source_node_id, target_node_id, edge_type)
);

CREATE INDEX idx_flow_edges_account ON flow_edges(account_id);
CREATE INDEX idx_flow_edges_source ON flow_edges(source_node_id);
CREATE INDEX idx_flow_edges_target ON flow_edges(target_node_id);

ALTER TABLE flow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own flow edges" ON flow_edges
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- EVENTS (partitioned by month — largest table)
-- ============================================================
CREATE TABLE events (
  id              UUID DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL,
  contact_id      UUID NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('activecampaign', 'zapier', 'stripe')),
  event_type      TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  source_node_id  UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create partitions for 2026 (add more as needed)
CREATE TABLE events_2026_01 PARTITION OF events FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE events_2026_02 PARTITION OF events FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE events_2026_03 PARTITION OF events FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE events_2026_04 PARTITION OF events FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE events_2026_05 PARTITION OF events FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE events_2026_06 PARTITION OF events FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE events_2026_07 PARTITION OF events FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE events_2026_08 PARTITION OF events FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE events_2026_09 PARTITION OF events FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE events_2026_10 PARTITION OF events FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE events_2026_11 PARTITION OF events FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE events_2026_12 PARTITION OF events FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_events_contact_time ON events(contact_id, timestamp);
CREATE INDEX idx_events_platform_time ON events(platform, timestamp);
CREATE INDEX idx_events_account ON events(account_id, timestamp);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- AUDIT RUNS (results of running audit rules)
-- ============================================================
CREATE TABLE audit_runs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  summary         TEXT,
  -- Claude-generated plain-English summary
  finding_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own audit runs" ON audit_runs
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- ============================================================
-- AUDIT FINDINGS (individual findings from audit rules)
-- ============================================================
CREATE TABLE audit_findings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_run_id    UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  rule_id         TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  category        TEXT NOT NULL,
  title           TEXT NOT NULL,
  explanation     TEXT NOT NULL,
  affected_nodes  UUID[] DEFAULT '{}',
  affected_contacts UUID[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_findings_run ON audit_findings(audit_run_id);
CREATE INDEX idx_audit_findings_account ON audit_findings(account_id);

ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own findings" ON audit_findings
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );
