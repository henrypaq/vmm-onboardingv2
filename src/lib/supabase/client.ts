import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Use createBrowserClient from @supabase/ssr for proper cookie handling
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      getAll() {
        return document.cookie.split('; ').map(cookie => {
          const [name, ...rest] = cookie.split('=');
          return { name, value: rest.join('=') };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${value}`;
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
          if (options?.secure) cookieString += `; secure`;
          if (options?.httpOnly) cookieString += `; httponly`;
          document.cookie = cookieString;
        });
      },
    },
    auth: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`
    }
  }
);
