import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken } from '@/lib/db/database';

// Consistent redirect URI construction
function getGoogleRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
  return `${baseUrl}/api/oauth/client/connect/google`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // Onboarding link token
  
  try {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('Client Google OAuth route called');
    console.log('Code:', code ? `Present: ${code.substring(0, 10)}...` : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);
    console.log('Token:', token);

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_denied&platform=google&message=User denied access`
      );
    }

    // If no code, this is the initial OAuth request - redirect to Google
    if (!code) {
      console.log('Initiating Client Google OAuth flow');
      
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

      // Get the scopes for Google from the link data
      const googleScopes = linkData.requested_permissions?.google || ['openid email profile'];
      const scopesParam = googleScopes.join(' ');
      
      console.log('Google scopes from link data:', googleScopes);
      console.log('Google scopes param:', scopesParam);

      // Check environment variables
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_not_configured&platform=google&message=Google OAuth not configured`
        );
      }

      const redirectUri = getGoogleRedirectUri();
      const stateParam = `client_${token}_${Date.now()}`;
      
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopesParam)}&response_type=code&state=${stateParam}`;
      
      console.log('Redirecting to Google OAuth:', oauthUrl);
      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth callback
    if (!token) {
      console.error('Google OAuth callback missing token parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/demo-token-12345?error=oauth_failed&platform=google&message=No onboarding token received`
      );
    }

    // Validate state parameter (should contain the token)
    if (!state || !state.startsWith(`client_${token}_`)) {
      console.error('Google OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_failed&platform=google&message=Invalid state parameter`
      );
    }

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_not_configured&platform=google&message=Google OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('✅ Client Google OAuth: Token exchange successful');

    // Fetch user information from Google
    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
    console.log('✅ Client Google OAuth: User info fetched successfully');

    // TODO: Store client platform connection in database
    // For now, just log the success
    console.log('✅ Client Google OAuth: Connection successful!');
    console.log('✅ Client Google OAuth: User ID:', userInfo.id);
    console.log('✅ Client Google OAuth: User email:', userInfo.email);
    console.log('✅ Client Google OAuth: User name:', userInfo.name);

    // Redirect back to onboarding with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?connected=google&success=true&username=${encodeURIComponent(userInfo.name || 'Connected')}`
    );
  } catch (error) {
    console.error('Client Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token || 'demo-token-12345'}?error=oauth_failed&platform=google&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getGoogleRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const tokenParams = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code,
    grant_type: 'authorization_code',
  };

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(tokenParams),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText,
    });
    throw new Error(`Google token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google user info: ${response.statusText}`);
  }

  return await response.json();
}
