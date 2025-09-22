import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchPlatformUserInfo, storePlatformConnection } from '@/lib/oauth/oauth-utils';

// Admin OAuth connection endpoints
// These will be used when admins connect their platform accounts in the settings

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    searchParams.get('state'); // Store state for validation if needed
    const error = searchParams.get('error');

    console.log(`OAuth endpoint called for platform: ${platform}`);
    console.log(`Request URL: ${request.url}`);
    console.log(`Code parameter: ${code}`);
    console.log(`Error parameter: ${error}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);

  // Handle OAuth callback
  if (code) {
    try {
      console.log(`OAuth callback received for ${platform} with code: ${code}`);
      
      // Get the redirect URI that was used for this OAuth flow
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const redirectUri = `${baseUrl}/api/oauth/admin/connect/${platform}`;
      
      // Exchange code for access token
      const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
      console.log(`Token exchange successful for ${platform}`);
      
      // Fetch user information from the platform
      const userInfo = await fetchPlatformUserInfo(platform, tokenResponse.access_token);
      console.log(`User info fetched for ${platform}:`, userInfo);
      
      // Define scopes based on platform
      const scopes = getScopesForPlatform(platform);
      
      // TODO: Get real admin ID from authentication/session
      // For now, using a mock admin ID - replace with real auth
      const mockAdminId = '00000000-0000-0000-0000-000000000001';
      
      // Store the platform connection in the database
      await storePlatformConnection(mockAdminId, platform, tokenResponse, userInfo, scopes);
      console.log(`Platform connection stored for ${platform}`);
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?connected=${platform}&success=true&username=${encodeURIComponent(userInfo.username || userInfo.name || 'Connected')}`);
    } catch (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=oauth_failed&platform=${platform}`);
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=oauth_denied`);
  }

  // Initiate OAuth flow
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://your-netlify-url.netlify.app' : 'http://localhost:3000');
  const redirectUri = `${baseUrl}/api/oauth/admin/connect/${platform}`;
  
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Redirect URI: ${redirectUri}`);
  
  // Check environment variables and generate OAuth URLs based on platform
  let oauthUrl = '';
  
  console.log(`Environment variables check for ${platform}:`);
  console.log(`NEXT_PUBLIC_META_APP_ID: ${process.env.NEXT_PUBLIC_META_APP_ID ? 'SET' : 'NOT SET'}`);
  console.log(`META_APP_SECRET: ${process.env.META_APP_SECRET ? 'SET' : 'NOT SET'}`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
  console.log(`TIKTOK_CLIENT_KEY: ${process.env.TIKTOK_CLIENT_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`SHOPIFY_CLIENT_ID: ${process.env.SHOPIFY_CLIENT_ID ? 'SET' : 'NOT SET'}`);
  
  switch (platform) {
    case 'meta':
      if (!process.env.NEXT_PUBLIC_META_APP_ID) {
        console.error('NEXT_PUBLIC_META_APP_ID environment variable is not set');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/settings?error=oauth_not_configured&platform=meta&message=Meta OAuth not configured - NEXT_PUBLIC_META_APP_ID missing`);
      }
      oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,ads_management&response_type=code&state=admin_${Date.now()}`;
      break;
    case 'google':
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/settings?error=oauth_not_configured&platform=google&message=Google OAuth not configured - GOOGLE_CLIENT_ID missing`);
      }
      const adminGoogleScopes = ['openid', 'email', 'profile'];
      console.log('[AdminOAuth][google] Requested scopes', adminGoogleScopes);
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(adminGoogleScopes.join(' '))}&response_type=code&state=admin_${Date.now()}`;
      break;
    case 'tiktok':
      if (!process.env.TIKTOK_CLIENT_KEY) {
        console.error('TIKTOK_CLIENT_KEY environment variable is not set');
        return NextResponse.json({ error: 'TikTok OAuth not configured - TIKTOK_CLIENT_KEY missing' }, { status: 500 });
      }
      oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=admin_${Date.now()}`;
      break;
    case 'shopify':
      if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_SHOP_DOMAIN) {
        console.error('SHOPIFY_CLIENT_ID or SHOPIFY_SHOP_DOMAIN environment variable is not set');
        return NextResponse.json({ error: 'Shopify OAuth not configured - missing credentials' }, { status: 500 });
      }
      oauthUrl = `https://${process.env.SHOPIFY_SHOP_DOMAIN}.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_orders,read_products,read_customers&redirect_uri=${encodeURIComponent(redirectUri)}&state=admin_${Date.now()}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  console.log(`Redirecting to OAuth URL for ${platform}:`, oauthUrl);
  
  // For debugging, also log the redirect URI being used
  console.log(`Using redirect URI: ${redirectUri}`);
  console.log(`Base URL: ${baseUrl}`);
  
  try {
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('Error redirecting to OAuth URL:', error);
    return NextResponse.json({ 
      error: 'OAuth redirect failed', 
      oauthUrl: oauthUrl,
      redirectUri: redirectUri 
    }, { status: 500 });
  }
  
  } catch (error) {
    console.error('OAuth endpoint error:', error);
    return NextResponse.json({ 
      error: 'OAuth endpoint failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getScopesForPlatform(platform: string): string[] {
  switch (platform) {
    case 'meta':
      return ['pages_read_engagement', 'pages_manage_posts', 'ads_read', 'pages_show_list'];
    case 'google':
      return ['openid', 'email', 'profile'];
    case 'tiktok':
      return ['user.info.basic', 'video.list'];
    case 'shopify':
      return ['read_orders', 'read_products', 'read_customers'];
    default:
      return [];
  }
}
