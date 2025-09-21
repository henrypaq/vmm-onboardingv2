import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken } from '@/lib/db/database';

// Consistent redirect URI construction
function getMetaRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
  return `${baseUrl}/api/oauth/client/connect/meta`;
}

interface MetaTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

interface MetaUserInfo {
  id: string;
  name: string;
  email?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // Onboarding link token
  
  try {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('Client Meta OAuth route called');
    console.log('Code:', code ? `Present: ${code.substring(0, 10)}...` : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);
    console.log('Token:', token);

    // Handle OAuth errors
    if (error) {
      console.error('Meta OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_denied&platform=meta&message=User denied access`
      );
    }

    // If no code, this is the initial OAuth request - redirect to Meta
    if (!code) {
      console.log('Initiating Client Meta OAuth flow');
      
      if (!token) {
        console.error('No onboarding token provided');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/demo-token-12345?error=invalid_token&message=No onboarding token provided`
        );
      }

      // Fetch the onboarding link to get the requested scopes
      const linkData = await getOnboardingLinkByToken(token);
      if (!linkData) {
        console.error('Invalid onboarding token:', token);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/demo-token-12345?error=invalid_token&message=Invalid onboarding token`
        );
      }

      // Get the scopes for Meta from the link data
      const metaScopes = linkData.requested_permissions?.meta || ['pages_show_list'];
      const scopesParam = metaScopes.join(',');
      
      console.log('Meta scopes from link data:', metaScopes);
      console.log('Meta scopes param:', scopesParam);

      // Check environment variables
      if (!process.env.NEXT_PUBLIC_META_APP_ID) {
        console.error('NEXT_PUBLIC_META_APP_ID environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_not_configured&platform=meta&message=Meta OAuth not configured`
        );
      }

      const redirectUri = getMetaRedirectUri();
      const stateParam = `client_${token}_${Date.now()}`;
      
      const oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopesParam)}&response_type=code&state=${stateParam}`;
      
      console.log('Redirecting to Meta OAuth:', oauthUrl);
      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth callback
    if (!token) {
      console.error('Meta OAuth callback missing token parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/demo-token-12345?error=oauth_failed&platform=meta&message=No onboarding token received`
      );
    }

    // Validate state parameter (should contain the token)
    if (!state || !state.startsWith(`client_${token}_`)) {
      console.error('Meta OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_failed&platform=meta&message=Invalid state parameter`
      );
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_META_APP_ID || !process.env.META_APP_SECRET) {
      console.error('Meta OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_not_configured&platform=meta&message=Meta OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('✅ Client Meta OAuth: Token exchange successful');

    // Fetch user information from Meta
    const userInfo = await fetchMetaUserInfo(tokenResponse.access_token);
    console.log('✅ Client Meta OAuth: User info fetched successfully');

    // TODO: Store client platform connection in database
    // For now, just log the success
    console.log('✅ Client Meta OAuth: Connection successful!');
    console.log('✅ Client Meta OAuth: User ID:', userInfo.id);
    console.log('✅ Client Meta OAuth: User name:', userInfo.name);

    // Redirect back to onboarding with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?connected=meta&success=true&username=${encodeURIComponent(userInfo.name || 'Connected')}`
    );
  } catch (error) {
    console.error('Client Meta OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token || 'demo-token-12345'}?error=oauth_failed&platform=meta&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = getMetaRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error('Meta OAuth credentials not configured');
  }

  const tokenParams = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code,
  };

  const response = await fetch('https://graph.facebook.com/v17.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(tokenParams),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Meta token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText,
    });
    throw new Error(`Meta token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}

async function fetchMetaUserInfo(accessToken: string): Promise<MetaUserInfo> {
  const response = await fetch(`https://graph.facebook.com/v17.0/me?access_token=${accessToken}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Meta user info: ${response.statusText}`);
  }

  return await response.json();
}
