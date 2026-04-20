import { createClient } from "@supabase/supabase-js";

// Admin client using service role key — bypasses RLS.
// Use ONLY for server-side operations that need to bypass row-level security,
// such as API key validation from external services (Zapier, webhooks).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
