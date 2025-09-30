import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchPlatformUserInfo } from '@/lib/oauth/oauth-utils';

// Client OAuth connection endpoints
// These will be used when clients connect their platform accounts during onboarding

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');
  const token = searchParams.get('token'); // Onboarding link token (may be absent if passed via state)

  console.log('[ClientOAuth] Incoming request', {
    platform,
    hasCode: Boolean(code),
    hasError: Boolean(error),
    hasTokenQuery: Boolean(token),
    hasState: Boolean(stateParam)
  });

  // Handle OAuth callback
  if (code) {
    // Prefer token from query, else parse from state
    let flowToken = token;
    if (!flowToken && stateParam) {
      try {
        const parsed = JSON.parse(stateParam);
        if (parsed && typeof parsed === 'object' && parsed.token) {
          flowToken = parsed.token as string;
        }
      } catch (e) {
        console.warn('[ClientOAuth] Failed to parse state JSON', e);
      }
    }

    if (!flowToken) {
      console.error('[ClientOAuth] Missing onboarding token in callback');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_onboarding_token`);
    }
    try {
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/client/connect/${platform}`;
      
      // Exchange code for access token
      const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
      
      // Fetch user information from the platform
      const userInfo = await fetchPlatformUserInfo(platform, tokenResponse.access_token);
      
      // Store OAuth data temporarily in session storage or pass via URL
      // For now, we'll store it in the onboarding request's platform_connections field
      console.log(`[ClientOAuth] Success for ${platform}`, {
        userId: userInfo?.id ?? 'unknown',
        scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : []
      });
      
      // Derive scopes robustly. Some providers (e.g., Meta) don't return scope in token response.
      let resolvedScopes: string[] = [];
      if (tokenResponse.scope) {
        resolvedScopes = tokenResponse.scope.split(' ');
      } else {
        switch (platform) {
          case 'meta':
            resolvedScopes = ['pages_read_engagement', 'pages_manage_posts', 'ads_read', 'pages_show_list'];
            break;
          case 'google':
            resolvedScopes = ['openid', 'email', 'profile'];
            break;
          case 'tiktok':
            resolvedScopes = ['user_info', 'video_read'];
            break;
          default:
            resolvedScopes = [];
        }
      }

      // Store the OAuth data in the onboarding request
      try {
        // Prefer internal call on same origin when running on Netlify/Next to avoid CORS and env domain mismatch
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const storeUrl = baseUrl
          ? `${baseUrl}/api/onboarding/store-oauth`
          : `/api/onboarding/store-oauth`;
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/store-oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: flowToken,
            platform,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenExpiresAt: tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : undefined,
            scopes: resolvedScopes,
            platformUserId: userInfo?.id || '',
            platformUsername: userInfo?.username || userInfo?.name || ''
          })
        });
        
        if (!response.ok) {
          console.warn('[ClientOAuth] Failed to store OAuth data, continuing anyway');
        }
      } catch (error) {
        console.warn('[ClientOAuth] Error storing OAuth data:', error);
      }
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${flowToken}?connected=${platform}&success=true&step=${getNextStep(platform)}`);
    } catch (error) {
      console.error('[ClientOAuth] OAuth error during token exchange', error);
      const fallbackToken = token || (stateParam ? safeExtractTokenFromState(stateParam) : undefined);
      const dest = fallbackToken
        ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${fallbackToken}?error=oauth_failed&success=false`
        : `${process.env.NEXT_PUBLIC_APP_URL}/?error=oauth_failed`;
      return NextResponse.redirect(dest);
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error('[ClientOAuth] OAuth provider returned error:', error);
    const fallbackToken = token || (stateParam ? safeExtractTokenFromState(stateParam) : undefined);
    const dest = fallbackToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${fallbackToken}?error=oauth_denied&success=false`
      : `${process.env.NEXT_PUBLIC_APP_URL}/?error=oauth_denied`;
    return NextResponse.redirect(dest);
  }

  // Initiate OAuth flow
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/client/connect/${platform}`;
  const onboardingToken = searchParams.get('token');
  if (!onboardingToken) {
    console.error('[ClientOAuth] Missing onboarding token when initiating OAuth');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_onboarding_token`);
  }

  // Put token and platform inside state to ensure round-trip integrity
  const stateObject = {
    flow: 'client',
    platform,
    token: onboardingToken,
    ts: Date.now()
  };
  console.log('[ClientOAuth] State (outgoing)', stateObject);
  const state = JSON.stringify(stateObject);
  
  // Generate OAuth URLs based on platform
  let oauthUrl = '';
  
  switch (platform) {
    case 'meta':
      oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_read_engagement,pages_manage_posts,ads_read,pages_show_list&response_type=code&state=${encodeURIComponent(state)}`;
      break;
    case 'google':
      const googleScopes = ['openid', 'email', 'profile'];
      console.log('[ClientOAuth][google] Requested scopes', googleScopes);
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(googleScopes.join(' '))}&response_type=code&state=${encodeURIComponent(state)}`;
      break;
    case 'tiktok':
      oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      break;
    case 'shopify':
      oauthUrl = `https://${process.env.SHOPIFY_SHOP_DOMAIN}.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_orders,read_products,read_customers&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  return NextResponse.redirect(oauthUrl);
}

function getNextStep(platform: string): number {
  const platforms = ['meta', 'google', 'tiktok', 'shopify'];
  const currentIndex = platforms.indexOf(platform);
  return currentIndex + 1; // Next step index
}

function safeExtractTokenFromState(stateParam: string): string | undefined {
  try {
    const parsed = JSON.parse(stateParam);
    return parsed?.token;
  } catch {
    return undefined;
  }
}
