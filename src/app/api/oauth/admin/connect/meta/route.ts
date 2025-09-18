import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateAdminAccount } from '@/lib/db/database';

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
    console.log('Code:', code ? 'Present' : 'Missing');
    console.log('Error:', error);
    console.log('State:', state);

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

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
      const redirectUri = `${baseUrl}/api/oauth/admin/connect/meta`;
      
      console.log('Environment check:');
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('baseUrl:', baseUrl);
      console.log('redirectUri:', redirectUri);
      
      const oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,ads_management&response_type=code&state=admin_${Date.now()}`;
      
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
    await createOrUpdateAdminAccount({
      admin_id: mockAdminId,
      provider: 'meta',
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
      scope: ['pages_show_list', 'ads_management'],
      provider_user_id: userInfo.id,
      provider_email: userInfo.email,
      provider_name: userInfo.name,
    });

    console.log('Meta connection stored successfully');

    // Redirect back to admin settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?connected=meta&success=true&username=${encodeURIComponent(userInfo.name || 'Connected')}`
    );

  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=meta&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

async function exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/api/oauth/admin/connect/meta`;

  if (!clientId || !clientSecret) {
    throw new Error('Meta OAuth credentials not configured');
  }

  const response = await fetch('https://graph.facebook.com/v17.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Meta token exchange failed:', errorText);
    throw new Error(`Meta token exchange failed: ${errorText}`);
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
