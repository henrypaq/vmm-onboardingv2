import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateAdminAccount } from '@/lib/db/database';

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
    console.log('Code:', code ? 'Present' : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);

    // If no code, this is the initial OAuth request - redirect to Google
    if (!code) {
      console.log('Initiating Google OAuth flow');
      
      // Check environment variables
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=google&message=Google OAuth not configured - GOOGLE_CLIENT_ID missing`
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
      const redirectUri = `${baseUrl}/api/oauth/admin/connect/google`;
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('baseUrl:', baseUrl);
      console.log('redirectUri:', redirectUri);
      
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords&response_type=code&state=admin_${Date.now()}`;
      
      console.log('Redirecting to Google OAuth:', oauthUrl);
      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_denied&platform=google&message=User denied access`
      );
    }

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=google&message=Google OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('Token exchange successful');

    // Fetch user information from Google
    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
    console.log('User info fetched:', userInfo);

    // TODO: Get real admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';

    // Store the platform connection in the database
    console.log('Storing Google connection in database...');
    console.log('Account data:', {
      admin_id: mockAdminId,
      provider: 'google',
      access_token: tokenResponse.access_token ? 'Present' : 'Missing',
      refresh_token: tokenResponse.refresh_token ? 'Present' : 'Missing',
      expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scope: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/adwords'],
      provider_user_id: userInfo.id,
      provider_email: userInfo.email,
      provider_name: userInfo.name,
    });

    const savedAccount = await createOrUpdateAdminAccount({
      admin_id: mockAdminId,
      provider: 'google',
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scope: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/adwords'],
      provider_user_id: userInfo.id,
      provider_email: userInfo.email,
      provider_name: userInfo.name,
    });

    console.log('Google connection stored successfully:', savedAccount);

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
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/api/oauth/admin/connect/google`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
      grant_type: 'authorization_code',
    }),
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
