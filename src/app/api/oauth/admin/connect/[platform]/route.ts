import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchPlatformUserInfo, storePlatformConnection } from '@/lib/oauth/oauth-utils';

// Admin OAuth connection endpoints
// These will be used when admins connect their platform accounts in the settings

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const _state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log(`OAuth endpoint called for platform: ${platform}`);
  console.log(`Request URL: ${request.url}`);
  console.log(`Code parameter: ${code}`);
  console.log(`Error parameter: ${error}`);

  // Handle OAuth callback
  if (code) {
    try {
      console.log(`OAuth callback received for ${platform} with code: ${code}`);
      
      // Get the redirect URI that was used for this OAuth flow
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/admin/connect/${platform}`;
      
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
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/admin/connect/${platform}`;
  
  // Check environment variables and generate OAuth URLs based on platform
  let oauthUrl = '';
  
  console.log(`Environment variables check for ${platform}:`);
  console.log(`META_APP_ID: ${process.env.META_APP_ID ? 'SET' : 'NOT SET'}`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
  console.log(`TIKTOK_CLIENT_KEY: ${process.env.TIKTOK_CLIENT_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`SHOPIFY_CLIENT_ID: ${process.env.SHOPIFY_CLIENT_ID ? 'SET' : 'NOT SET'}`);
  
  switch (platform) {
    case 'meta':
      if (!process.env.META_APP_ID) {
        console.error('META_APP_ID environment variable is not set');
        return NextResponse.json({ error: 'Meta OAuth not configured - META_APP_ID missing' }, { status: 500 });
      }
      oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_read_engagement,pages_manage_posts,ads_read,pages_show_list&response_type=code&state=admin_${Date.now()}`;
      break;
    case 'google':
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        return NextResponse.json({ error: 'Google OAuth not configured - GOOGLE_CLIENT_ID missing' }, { status: 500 });
      }
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords&response_type=code&state=admin_${Date.now()}`;
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
  return NextResponse.redirect(oauthUrl);
}

function getScopesForPlatform(platform: string): string[] {
  switch (platform) {
    case 'meta':
      return ['pages_read_engagement', 'pages_manage_posts', 'ads_read', 'pages_show_list'];
    case 'google':
      return ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/adwords'];
    case 'tiktok':
      return ['user.info.basic', 'video.list'];
    case 'shopify':
      return ['read_orders', 'read_products', 'read_customers'];
    default:
      return [];
  }
}
