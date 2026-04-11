/**
 * Maps low-level fetch errors (common in WebKit as "Load failed") to actionable copy
 * and logs structured details for debugging production auth issues.
 */

export function logAuthClientError(scope: string, error: unknown): void {
  const base: Record<string, unknown> = { scope };
  if (error instanceof Error) {
    base.name = error.name;
    base.message = error.message;
    base.cause = error.cause;
    if (process.env.NODE_ENV === 'development') {
      base.stack = error.stack;
    }
  } else {
    base.value = error;
  }
  console.error('[auth]', base);
}

export function userFacingAuthError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'An unexpected error occurred.';

  const lower = raw.toLowerCase();
  if (
    lower === 'load failed' ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed')
  ) {
    return (
      'Could not reach the sign-in service (network error). ' +
      'Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy ANON_KEY) in your host (e.g. Netlify) with no extra spaces or quotes, ' +
      'check the browser Network tab for blocked requests to your *.supabase.co host, and try turning off strict VPN/ad blockers for this site.'
    );
  }

  return raw;
}
