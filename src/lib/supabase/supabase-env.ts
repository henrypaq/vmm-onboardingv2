/**
 * Non-inlined helpers and docs only.
 * IMPORTANT: For Next.js client/server bundles, read NEXT_PUBLIC_* and secrets with
 * literal `process.env.NEXT_PUBLIC_...` in client.ts, server.ts, and middleware.ts so
 * values are inlined at build time (see Next.js env docs).
 * @see https://supabase.com/docs/guides/api/api-keys
 */

export function trimEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const SUPABASE_KEY_HELP =
  'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).';
