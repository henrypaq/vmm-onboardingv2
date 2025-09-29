import { NextRequest, NextResponse } from 'next/server';
import { createAdminPlatformConnection, getAdminPlatformConnections } from '@/lib/db/database';

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

    console.log('TikTok OAuth route called');
    console.log('Code:', code ? `Present: ${code.substring(0, 10)}...` : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);
    console.log('Full URL:', request.url);

    // If no code, this is the initial OAuth request - redirect to TikTok
    if (!code) {
      console.log('Initiating TikTok OAuth flow');
      
      // Check environment variables
      if (!process.env.TIKTOK_CLIENT_KEY) {
        console.error('TIKTOK_CLIENT_KEY environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=tiktok&message=TikTok OAuth not configured - TIKTOK_CLIENT_KEY missing`
        );
      }

      const redirectUri = getTikTokRedirectUri();
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('redirectUri:', redirectUri);
      
      const state = `admin_${Date.now()}`;
      const oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      console.log('Generated state:', state);
      console.log('🔗 TikTok OAuth: Redirecting to TikTok');

      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth errors
    if (error) {
      console.error('TikTok OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_denied&platform=tiktok&message=User denied access`
      );
    }

    // Check if we have a code (this is a callback)
    if (!code) {
      console.error('TikTok OAuth callback missing code parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=tiktok&message=No authorization code received`
      );
    }

    // Validate state parameter (basic validation)
    if (!state || !state.startsWith('admin_')) {
      console.error('TikTok OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=tiktok&message=Invalid state parameter`
      );
    }

    // Check environment variables
    if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
      console.error('TikTok OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=tiktok&message=TikTok OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('Token exchange successful');

    // Fetch user information from TikTok
    const userInfo = await fetchTikTokUserInfo(tokenResponse.access_token);
    console.log('User info fetched:', userInfo);

    // TODO: Get real admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';

    // Store the platform connection in the database
    const connectionData = {
      admin_id: mockAdminId,
      platform: 'tiktok',
      platform_user_id: userInfo.data.user.open_id,
      platform_username: userInfo.data.user.display_name,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      token_expires_at: tokenResponse.expires_in ? 
        new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : 
        null,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(',') : [],
      is_active: true
    };

    console.log('Storing TikTok connection:', connectionData);

    // Check if connection already exists
    const existingConnections = await getAdminPlatformConnections(mockAdminId);
    const existingTikTokConnection = existingConnections.find(conn => conn.platform === 'tiktok');

    let connection;
    if (existingTikTokConnection) {
      // Update existing connection
      console.log('Updating existing TikTok connection');
      connection = await createAdminPlatformConnection(connectionData);
    } else {
      // Create new connection
      console.log('Creating new TikTok connection');
      connection = await createAdminPlatformConnection(connectionData);
    }

    console.log('TikTok connection stored successfully:', connection);

    // Redirect back to admin settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?connected=tiktok&message=TikTok account connected successfully`
    );

  } catch (error) {
    console.error('TikTok OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=tiktok&message=TikTok OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    redirect_uri: getTikTokRedirectUri()
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

function getTikTokRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
  return `${baseUrl}/api/oauth/admin/connect/tiktok`;
}
