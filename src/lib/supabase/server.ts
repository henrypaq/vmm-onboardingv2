import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as supabaseCreateClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_KEY_HELP, trimEnv } from '@/lib/supabase/supabase-env';

let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  // Literal env reads so CI/Netlify inlines server secrets at build when needed
  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServiceKey = trimEnv(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!supabaseUrl || !supabaseServiceKey) {
    const message = 'Supabase envs missing: ' + JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY?.trim()),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    console.error('[Supabase] ' + message);
    throw new Error(`Supabase configuration missing. ${SUPABASE_KEY_HELP}`);
  }

  cachedAdminClient = supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}

export async function createClient() {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_SUPABASE_PUBLISHABLE_KEY
  );
  if (!url || !publishableKey) {
    throw new Error(`Supabase server session client misconfigured. ${SUPABASE_KEY_HELP}`);
  }

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _responseHeaders) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; middleware refreshes session.
        }
      },
    },
  });
}
