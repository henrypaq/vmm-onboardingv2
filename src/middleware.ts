import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { trimEnv } from '@/lib/supabase/supabase-env';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_SUPABASE_PUBLISHABLE_KEY
  );

  if (!supabaseUrl || !publishableKey) {
    console.error(
      '[middleware] Missing Supabase URL or publishable key; skipping session refresh.'
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, responseHeaders) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          if (responseHeaders && typeof responseHeaders === 'object') {
            for (const [key, value] of Object.entries(responseHeaders)) {
              if (typeof value === 'string') {
                supabaseResponse.headers.set(key, value);
              }
            }
          }
        },
      },
    }
  );

  // Refresh session if expired - this ensures cookies are up to date
  await supabase.auth.getSession();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
