import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_KEY_HELP, trimEnv } from '@/lib/supabase/supabase-env';

// Literal process.env.* so Next.js inlines Netlify/Vercel build-time env (do not refactor to a helper).
const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = trimEnv(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_SUPABASE_PUBLISHABLE_KEY
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? '✅' : '❌'
  );
  throw new Error(`Missing Supabase environment variables. ${SUPABASE_KEY_HELP}`);
}

let supabaseHost: string;
try {
  supabaseHost = new URL(supabaseUrl).host;
} catch {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Fix your .env / deployment environment variables.'
  );
}

const debugSupabaseFetch =
  typeof window !== 'undefined' &&
  (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_SUPABASE === '1');

const nativeFetch = globalThis.fetch.bind(globalThis);

function createSupabaseAwareFetch(): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    const isSupabaseCall = url.includes(supabaseHost);
    if (debugSupabaseFetch && isSupabaseCall) {
      console.debug('[Supabase fetch →]', url.split('?')[0]);
    }
    try {
      const response = await nativeFetch(input, init);
      if (debugSupabaseFetch && isSupabaseCall && !response.ok) {
        console.warn('[Supabase fetch]', response.status, response.statusText, url.split('?')[0]);
      }
      return response;
    } catch (err) {
      if (isSupabaseCall) {
        console.error('[Supabase fetch failed]', {
          host: supabaseHost,
          path: (() => {
            try {
              return new URL(url).pathname;
            } catch {
              return url;
            }
          })(),
          error: err instanceof Error ? { name: err.name, message: err.message, cause: err.cause } : err,
        });
      }
      throw err;
    }
  };
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: createSupabaseAwareFetch() },
});
