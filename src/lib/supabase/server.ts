import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // Provide more actionable diagnostics in production logs instead of crashing early
    const message = 'Supabase envs missing: ' + JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(supabaseServiceKey),
    });
    console.error('[Supabase] ' + message);
    throw new Error('Supabase configuration missing. See server logs for details.');
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedClient;
}

// Export createClient function for API routes
export function createClient() {
  return getSupabaseAdmin();
}
