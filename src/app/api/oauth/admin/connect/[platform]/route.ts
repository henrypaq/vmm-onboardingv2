import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchPlatformUserInfo, storePlatformConnection } from '@/lib/oauth/oauth-utils';
import { generateAuthUrl, extractOAuthParams, validateOAuthPlatform } from '@/lib/api/oauth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    validateOAuthPlatform(platform);
    
    const { code, error } = extractOAuthParams(request);

    // Handle OAuth callback
    if (code) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/oauth/admin/connect/${platform}`;
        
        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
        
        // Fetch user information from the platform
        const userInfo = await fetchPlatformUserInfo(platform, tokenResponse.access_token);
        
        // Define scopes based on platform
        const scopes = getScopesForPlatform(platform);
        
        // TODO: Get real admin ID from authentication/session
        const mockAdminId = '00000000-0000-0000-0000-000000000001';
        
        // Store the platform connection in the database
        await storePlatformConnection(mockAdminId, platform, tokenResponse, userInfo, scopes);
        
        return NextResponse.redirect(
          `${baseUrl}/admin/settings?connected=${platform}&success=true&username=${encodeURIComponent(userInfo.username || userInfo.name || 'Connected')}`
        );
      } catch (error) {
        console.error('OAuth callback error:', error);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/admin/settings?error=oauth_failed&platform=${platform}`);
      }
    }

    // Handle OAuth errors
    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/admin/settings?error=oauth_denied`);
    }

    // Initiate OAuth flow
    const oauthUrl = generateAuthUrl(platform, `admin_${Date.now()}`);
    return NextResponse.redirect(oauthUrl);
    
  } catch (error) {
    console.error('OAuth endpoint error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=oauth_failed&platform=${platform}`);
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
