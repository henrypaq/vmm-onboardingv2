/**
 * Canonical public site URL for auth email links (confirm, reset) and OAuth redirects.
 * Prefer NEXT_PUBLIC_APP_URL so confirmation emails point at production even if signup
 * was triggered while running the app on localhost.
 */
export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}
