import { NextRequest, NextResponse } from 'next/server';
import { createAdminPlatformConnection, AdminPlatformConnection } from '@/lib/db/database';

// Consistent redirect URI construction
function getMetaRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
  return `${baseUrl}/api/oauth/admin/connect/meta`;
}

interface MetaTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('Meta OAuth route called');
    console.log('Code:', code ? `Present: ${code.substring(0, 10)}...` : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);
    console.log('Full URL:', request.url);

    // If no code, this is the initial OAuth request - redirect to Facebook
    if (!code) {
      console.log('Initiating Meta OAuth flow');
      
      // Check environment variables
      if (!process.env.NEXT_PUBLIC_META_APP_ID) {
        console.error('NEXT_PUBLIC_META_APP_ID environment variable is not set');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=meta&message=Meta OAuth not configured - NEXT_PUBLIC_META_APP_ID missing`
        );
      }

      const redirectUri = getMetaRedirectUri();
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('redirectUri:', redirectUri);
      
      const state = `admin_${Date.now()}`;
      const oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,ads_management&response_type=code&state=${state}`;
      
      console.log('Generated state:', state);
      
      console.log('Redirecting to Meta OAuth:', oauthUrl);
      return NextResponse.redirect(oauthUrl);
    }

    // Handle OAuth errors
    if (error) {
      console.error('Meta OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_denied&platform=meta&message=User denied access`
      );
    }

    // Check if we have a code (this is a callback)
    if (!code) {
      console.error('Meta OAuth callback missing code parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=meta&message=No authorization code received`
      );
    }

    // Validate state parameter (basic validation)
    if (!state || !state.startsWith('admin_')) {
      console.error('Meta OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=meta&message=Invalid state parameter`
      );
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_META_APP_ID || !process.env.META_APP_SECRET) {
      console.error('Meta OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=meta&message=Meta OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('Token exchange successful');

    // Fetch user information from Meta
    const userInfo = await fetchMetaUserInfo(tokenResponse.access_token);
    console.log('User info fetched:', userInfo);

    // TODO: Get real admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';

    // Store the platform connection in the database
    console.log('Storing Meta connection in database...');
    console.log('Account data:', {
      admin_id: mockAdminId,
      platform: 'meta',
      platform_user_id: userInfo.id,
      platform_username: userInfo.name,
      access_token: tokenResponse.access_token ? 'Present' : 'Missing',
      refresh_token: tokenResponse.refresh_token ? 'Present' : 'Missing',
      token_expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scopes: ['pages_show_list', 'ads_management'],
      is_active: true,
    });

    const savedAccount = await createAdminPlatformConnection({
      admin_id: mockAdminId,
      platform: 'meta',
      platform_user_id: userInfo.id,
      platform_username: userInfo.name,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scopes: ['pages_show_list', 'ads_management'],
      is_active: true,
    });

    console.log('Meta connection stored successfully:', savedAccount);

    // Redirect back to admin settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?connected=meta&success=true&username=${encodeURIComponent(userInfo.name || 'Connected')}`
    );

  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=meta&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
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

  console.log('Token exchange parameters:');
  console.log('client_id:', clientId);
  console.log('client_secret:', clientSecret ? 'Present' : 'Missing');
  console.log('redirect_uri:', redirectUri);
  console.log('code:', code ? `${code.substring(0, 10)}...` : 'Missing');

  const tokenParams = {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code,
  };

  console.log('Token exchange request body:', tokenParams);

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
      url: 'https://graph.facebook.com/v17.0/oauth/access_token',
      clientId: clientId,
      redirectUri: redirectUri
    });
    throw new Error(`Meta token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('Meta token response:', { 
    access_token: data.access_token ? 'Present' : 'Missing',
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope
  });

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || undefined,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  };
}

async function fetchMetaUserInfo(accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v17.0/me?access_token=${accessToken}&fields=id,name,email`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch Meta user info:', errorText);
    throw new Error('Failed to fetch Meta user info');
  }

  const data = await response.json();
  console.log('Meta user info:', { 
    id: data.id,
    name: data.name,
    email: data.email ? 'Present' : 'Missing'
  });

  return {
    id: data.id,
    name: data.name,
    email: data.email,
  };
}
