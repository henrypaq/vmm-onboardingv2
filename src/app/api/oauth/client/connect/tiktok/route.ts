import { NextRequest, NextResponse } from 'next/server';

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface TikTokUserInfo {
  data: {
    user: {
      open_id: string;
      union_id: string;
      avatar_url: string;
      display_name: string;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const token = searchParams.get('token');

    console.log('TikTok Client OAuth route called');
    console.log('Code:', code ? `Present: ${code.substring(0, 10)}...` : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);
    console.log('Token:', token ? `Present: ${token.substring(0, 10)}...` : 'Missing');
    console.log('Full URL:', request.url);

    // If no code, this is the initial OAuth request - redirect to TikTok
    if (!code) {
      console.log('Initiating TikTok Client OAuth flow');
      
      // Check environment variables
      if (!process.env.TIKTOK_CLIENT_KEY) {
        console.error('TIKTOK_CLIENT_KEY environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_not_configured&platform=tiktok&message=TikTok OAuth not configured`
        );
      }

      if (!token) {
        console.error('No token provided for client OAuth');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding?error=missing_token&message=No onboarding token provided`
        );
      }

      const redirectUri = getTikTokClientRedirectUri();
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('redirectUri:', redirectUri);
      
      const state = `client_${token}_${Date.now()}`;
      const oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      console.log('Generated state:', state);
      console.log('🔗 TikTok Client OAuth: Redirecting to TikTok');

      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth errors
    if (error) {
      console.error('TikTok Client OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_denied&platform=tiktok&message=User denied access`
      );
    }

    // Check if we have a code (this is a callback)
    if (!code) {
      console.error('TikTok Client OAuth callback missing code parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_failed&platform=tiktok&message=No authorization code received`
      );
    }

    // Validate state parameter (basic validation)
    if (!state || !state.startsWith('client_')) {
      console.error('TikTok Client OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${token}?error=oauth_failed&platform=tiktok&message=Invalid state parameter`
      );
    }

    // Extract token from state
    const stateParts = state.split('_');
    const extractedToken = stateParts[1];
    
    if (!extractedToken) {
      console.error('TikTok Client OAuth no token in state:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding?error=invalid_state&message=Invalid state parameter`
      );
    }

    // Check environment variables
    if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
      console.error('TikTok OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${extractedToken}?error=oauth_not_configured&platform=tiktok&message=TikTok OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('TikTok token exchange successful');

    // Fetch user information from TikTok
    const userInfo = await fetchTikTokUserInfo(tokenResponse.access_token);
    console.log('TikTok user info fetched:', userInfo);

    // Store the OAuth data temporarily in the onboarding request
    const oauthData = {
      platform: 'tiktok',
      platform_user_id: userInfo.data.user.open_id,
      platform_username: userInfo.data.user.display_name,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      token_expires_at: tokenResponse.expires_in ? 
        new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : 
        null,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(',') : [],
      connected_at: new Date().toISOString()
    };

    console.log('Storing TikTok OAuth data for token:', extractedToken);

    // Store the OAuth data in the onboarding request
    const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/api/onboarding/store-oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: extractedToken,
        platform: 'tiktok',
        oauthData: oauthData
      })
    });

    if (!storeResponse.ok) {
      console.error('Failed to store TikTok OAuth data');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${extractedToken}?error=storage_failed&platform=tiktok&message=Failed to store OAuth data`
      );
    }

    console.log('TikTok OAuth data stored successfully');

    // Redirect back to onboarding with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${extractedToken}?connected=tiktok&message=TikTok account connected successfully`
    );

  } catch (error) {
    console.error('TikTok Client OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding?error=oauth_failed&platform=tiktok&message=TikTok OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
  const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
  
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: getTikTokClientRedirectUri()
  });

  console.log('Exchanging code for token with TikTok...');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('TikTok token exchange failed:', response.status, errorText);
    throw new Error(`TikTok token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('TikTok token exchange successful');
  
  return tokenData;
}

async function fetchTikTokUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const userInfoUrl = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name';
  
  console.log('Fetching TikTok user info...');
  
  const response = await fetch(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('TikTok user info fetch failed:', response.status, errorText);
    throw new Error(`TikTok user info fetch failed: ${response.status} ${errorText}`);
  }

  const userData = await response.json();
  console.log('TikTok user info fetched successfully');
  
  return userData;
}

function getTikTokClientRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
  return `${baseUrl}/api/oauth/client/connect/tiktok`;
}
