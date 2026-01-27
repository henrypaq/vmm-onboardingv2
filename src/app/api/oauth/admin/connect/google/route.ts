import { NextRequest, NextResponse } from 'next/server';
import { upsertAdminPlatformConnection, AdminPlatformConnection } from '@/lib/db/database';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - this route uses request.url, cookies, and OAuth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Consistent redirect URI construction
function getGoogleRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
  return `${baseUrl}/api/oauth/admin/connect/google`;
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
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('Google OAuth route called');
    console.log('Code:', code ? `Present: ${code.substring(0, 10)}...` : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);
    console.log('Full URL:', request.url);

    // If no code, this is the initial OAuth request - redirect to Google
    if (!code) {
      console.log('Initiating Google OAuth flow');
      
      // Check environment variables
      console.log('Google OAuth environment check:');
      console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
      console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
      console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
      
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=google&message=Google OAuth not configured - GOOGLE_CLIENT_ID missing`
        );
      }

      const redirectUri = getGoogleRedirectUri();
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('redirectUri:', redirectUri);
      
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
          const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&response_type=code&state=${state}`;
          console.log('Generated state with admin ID:', state);
          console.log('🔗 Google OAuth: Redirecting to Google with basic scopes');
          console.log('🔗 Google OAuth: Scopes: openid, email, profile');
          console.log('🔗 Google OAuth: URL:', oauthUrl);
          return NextResponse.redirect(oauthUrl);
        }
        
        console.error('No authenticated user found');
        console.error('Session result:', sessionResult);
        console.error('User result:', userResult);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=not_authenticated&message=Please log in to connect platforms`
        );
      }
      
      const adminId = session.user.id;
      const state = `admin_${adminId}_${Date.now()}`;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&response_type=code&state=${state}`;
      
      console.log('Generated state with admin ID:', state);
      
      console.log('🔗 Google OAuth: Redirecting to Google with basic scopes');
      console.log('🔗 Google OAuth: Scopes: openid, email, profile');
      console.log('🔗 Google OAuth: URL:', oauthUrl);
      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_denied&platform=google&message=User denied access`
      );
    }

    // Check if we have a code (this is a callback)
    if (!code) {
      console.error('Google OAuth callback missing code parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=google&message=No authorization code received`
      );
    }

    // Validate state parameter and extract admin ID
    if (!state || !state.startsWith('admin_')) {
      console.error('Google OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=google&message=Invalid state parameter`
      );
    }
    
    // Extract admin ID from state: admin_{adminId}_{timestamp}
    const stateParts = state.split('_');
    const adminId = stateParts.length >= 2 ? stateParts[1] : null;
    
    if (!adminId) {
      console.error('Google OAuth: Could not extract admin ID from state:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=google&message=Could not identify user`
      );
    }
    
    console.log('Extracted admin ID from state:', adminId);

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=google&message=Google OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('✅ Google OAuth: Token exchange successful');
    console.log('✅ Google OAuth: Access token received:', tokenResponse.access_token ? 'Present' : 'Missing');
    console.log('✅ Google OAuth: Token type:', tokenResponse.token_type);
    console.log('✅ Google OAuth: Expires in:', tokenResponse.expires_in, 'seconds');

    // Fetch user information from Google
    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
    console.log('✅ Google OAuth: User info fetched successfully');
    console.log('✅ Google OAuth: User ID:', userInfo.id);
    console.log('✅ Google OAuth: User email:', userInfo.email);
    console.log('✅ Google OAuth: User name:', userInfo.name);

    // Use admin ID from state parameter
    console.log('Using admin ID from OAuth state:', adminId);

    // Store the platform connection in the database
    console.log('Storing Google connection in database...');
    console.log('Account data:', {
      admin_id: adminId,
      platform: 'google',
      platform_user_id: userInfo.id,
      platform_username: userInfo.name,
      access_token: tokenResponse.access_token ? 'Present' : 'Missing',
      refresh_token: tokenResponse.refresh_token ? 'Present' : 'Missing',
      token_expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scopes: ['openid', 'email', 'profile'],
      is_active: true,
    });

    const savedAccount = await upsertAdminPlatformConnection({
      admin_id: adminId,
      platform: 'google',
      platform_user_id: userInfo.id,
      platform_username: userInfo.name,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scopes: ['openid', 'email', 'profile'],
      is_active: true,
    });

    console.log('✅ Google OAuth: Connection stored successfully in database');
    console.log('✅ Google OAuth: Database record ID:', savedAccount?.id || 'Unknown');
    console.log('✅ Google OAuth: Platform:', savedAccount?.platform || 'Unknown');
    console.log('✅ Google OAuth: Complete OAuth flow successful!');

    // Redirect back to admin settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?connected=google&success=true&username=${encodeURIComponent(userInfo.name || 'Connected')}`
    );

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=google&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
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

  console.log('Google token exchange parameters:');
  console.log('client_id:', clientId);
  console.log('client_secret:', clientSecret ? `Present: ${clientSecret.substring(0, 8)}...` : 'Missing');
  console.log('redirect_uri:', redirectUri);
  console.log('code:', code ? `${code.substring(0, 10)}...` : 'Missing');
  console.log('All Google env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));

  const tokenParams = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code,
    grant_type: 'authorization_code',
  };

  console.log('Google token exchange request body:', tokenParams);

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
      url: 'https://oauth2.googleapis.com/token',
      clientId: clientId,
      redirectUri: redirectUri
    });
    throw new Error(`Google token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('Google token response:', { 
    access_token: data.access_token ? 'Present' : 'Missing',
    expires_in: data.expires_in,
    refresh_token: data.refresh_token ? 'Present' : 'Missing',
    scope: data.scope
  });

  return data;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google user info fetch failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText
    });
    throw new Error(`Failed to fetch Google user info (${response.status}): ${errorText}`);
  }

  const userInfo = await response.json();
  console.log('Google user info:', {
    id: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    verified_email: userInfo.verified_email
  });

  return userInfo;
}
