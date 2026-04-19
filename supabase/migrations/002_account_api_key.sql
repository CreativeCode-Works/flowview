-- Add API key to accounts for Zapier integration auth
ALTER TABLE accounts ADD COLUMN api_key TEXT UNIQUE;

-- Generate a default API key for existing accounts
UPDATE accounts SET api_key = gen_random_uuid()::text WHERE api_key IS NULL;

-- Make it non-nullable going forward
ALTER TABLE accounts ALTER COLUMN api_key SET DEFAULT gen_random_uuid()::text;
ALTER TABLE accounts ALTER COLUMN api_key SET NOT NULL;

-- Index for fast lookup
CREATE INDEX idx_accounts_api_key ON accounts(api_key);
