import { NextRequest, NextResponse } from 'next/server';
import { upsertAdminPlatformConnection, AdminPlatformConnection } from '@/lib/db/database';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - this route uses request.url, cookies, and OAuth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
          const oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,ads_management&response_type=code&state=${state}`;
          console.log('Generated state with admin ID:', state);
          console.log('Redirecting to Meta OAuth:', oauthUrl);
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
      const oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,ads_management&response_type=code&state=${state}`;
      
      console.log('Generated state with admin ID:', state);
      
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

    // Validate state parameter and extract admin ID
    if (!state || !state.startsWith('admin_')) {
      console.error('Meta OAuth invalid state parameter:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=meta&message=Invalid state parameter`
      );
    }
    
    // Extract admin ID from state: admin_{adminId}_{timestamp}
    const stateParts = state.split('_');
    const adminId = stateParts.length >= 2 ? stateParts[1] : null;
    
    if (!adminId) {
      console.error('Meta OAuth: Could not extract admin ID from state:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_failed&platform=meta&message=Could not identify user`
      );
    }
    
    console.log('Extracted admin ID from state:', adminId);

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_META_APP_ID || !process.env.META_APP_SECRET) {
      console.error('Meta OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/admin/settings?error=oauth_not_configured&platform=meta&message=Meta OAuth credentials not configured`
      );
    }

    // Exchange code for access token
    console.log('🔄 Meta OAuth: Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('✅ Meta OAuth: Token exchange successful');

    // Fetch user information from Meta
    console.log('🔄 Meta OAuth: Fetching user info...');
    const userInfo = await fetchMetaUserInfo(tokenResponse.access_token);
    console.log('✅ Meta OAuth: User info fetched:', {
      id: userInfo.id,
      name: userInfo.name
    });

    // Use admin ID from state parameter
    console.log('🔄 Meta OAuth: Using admin ID from OAuth state:', adminId);

    // Store the platform connection in the database
    console.log('🔄 Meta OAuth: Storing connection in database...');
    console.log('📝 Meta OAuth: Account data:', {
      admin_id: adminId,
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

    try {
      const savedAccount = await upsertAdminPlatformConnection({
        admin_id: adminId,
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

      console.log('✅ Meta OAuth: Connection stored successfully:', {
        id: savedAccount.id,
        platform: savedAccount.platform,
        username: savedAccount.platform_username
      });
    } catch (saveError: any) {
      console.error('❌ Meta OAuth: Failed to save connection:', saveError);
      console.error('❌ Meta OAuth: Error details:', {
        message: saveError?.message,
        code: saveError?.code,
        details: saveError?.details,
        hint: saveError?.hint,
        stack: saveError?.stack
      });
      throw new Error(`Failed to save connection: ${saveError?.message || 'Unknown error'}`);
    }

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
