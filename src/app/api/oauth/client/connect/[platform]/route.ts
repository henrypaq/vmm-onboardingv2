import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchPlatformUserInfo } from '@/lib/oauth/oauth-utils';

// Client OAuth connection endpoints
// These will be used when clients connect their platform accounts during onboarding

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  searchParams.get('state'); // Store state for validation if needed
  const error = searchParams.get('error');
  const token = searchParams.get('token'); // Onboarding link token

  // Handle OAuth callback
  if (code && token) {
    try {
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/client/connect/${platform}`;
      
      // Exchange code for access token
      const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
      
      // Fetch user information from the platform
      const userInfo = await fetchPlatformUserInfo(platform, tokenResponse.access_token);
      
      // TODO: Store client platform connection in onboarding request
      console.log(`Client OAuth success for ${platform}:`, userInfo);
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}?connected=${platform}&success=true&step=${getNextStep(platform)}`);
    } catch (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}?error=oauth_failed&success=false`);
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}?error=oauth_denied&success=false`);
  }

  // Initiate OAuth flow
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/client/connect/${platform}`;
  
  // Generate OAuth URLs based on platform
  let oauthUrl = '';
  
  switch (platform) {
    case 'meta':
      oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_read_engagement,pages_manage_posts,ads_read,pages_show_list&response_type=code&state=client_${Date.now()}&token=${token}`;
      break;
    case 'google':
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords&response_type=code&state=client_${Date.now()}&token=${token}`;
      break;
    case 'tiktok':
      oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=client_${Date.now()}&token=${token}`;
      break;
    case 'shopify':
      oauthUrl = `https://${process.env.SHOPIFY_SHOP_DOMAIN}.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_orders,read_products,read_customers&redirect_uri=${encodeURIComponent(redirectUri)}&state=client_${Date.now()}&token=${token}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  return NextResponse.redirect(oauthUrl);
}

function getNextStep(platform: string): number {
  const platforms = ['meta', 'google', 'tiktok', 'shopify'];
  const currentIndex = platforms.indexOf(platform);
  return currentIndex + 1; // Next step index
}
