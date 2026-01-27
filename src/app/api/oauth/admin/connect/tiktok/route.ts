import { NextRequest, NextResponse } from 'next/server';
import { upsertAdminPlatformConnection, getAdminPlatformConnections } from '@/lib/db/database';
import { createClient } from '@/lib/supabase/server';

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

      // Get authenticated user ID and store in state
      const supabase = await createClient();
      
      // Try getSession first
      let session = null;
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data?.session;
      
      // If no session, try getUser as fallback
      if (!session?.user) {
        console.log('No session from getSession, trying getUser...');
        const userResult = await supabase.auth.getUser();
        if (userResult.data?.user) {
          console.log('getUser succeeded, using user ID:', userResult.data.user.id);
          const adminId = userResult.data.user.id;
          const state = `admin_${adminId}_${Date.now()}`;
          const redirectUri = getTikTokRedirectUri();
          const oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
          console.log('🔗 TikTok OAuth: Redirecting to TikTok');
          return NextResponse.redirect(oauthUrl);
        }
        
        console.error('No authenticated user found');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=not_authenticated&message=Please log in to connect platforms`
        );
      }
      
      const adminId = session.user.id;
      const state = `admin_${adminId}_${Date.now()}`;
      const redirectUri = getTikTokRedirectUri();
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('redirectUri:', redirectUri);
      console.log('Generated state with admin ID:', state);
      
      const oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      console.log('🔗 TikTok OAuth: Redirecting to TikTok');
      console.log('🔗 TikTok OAuth: OAuth URL:', oauthUrl);

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

    // Store the platform connection in the database
    const connectionData = {
      admin_id: adminId,
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
    // Use upsert to handle both create and update cases
    console.log('Upserting TikTok connection...');
    const connection = await upsertAdminPlatformConnection(connectionData);
    console.log('TikTok connection stored successfully:', connection);

    // Redirect back to admin settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?connected=tiktok&success=true&username=${encodeURIComponent(userInfo.data.user.display_name || 'Connected')}`
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
