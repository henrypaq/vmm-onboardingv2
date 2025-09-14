import { NextRequest, NextResponse } from 'next/server';

// Admin OAuth connection endpoints
// These will be used when admins connect their platform accounts in the settings

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth callback
  if (code) {
    try {
      // TODO: Exchange code for access token
      // TODO: Store admin platform connection in database
      // TODO: Redirect back to admin settings with success message
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?connected=${platform}`);
    } catch (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=oauth_failed`);
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=oauth_denied`);
  }

  // Initiate OAuth flow
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/admin/connect/${platform}`;
  
  // TODO: Generate OAuth URLs based on platform
  let oauthUrl = '';
  
  switch (platform) {
    case 'meta':
      oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_read_engagement,pages_manage_posts,ads_read,pages_show_list&response_type=code&state=admin_${Date.now()}`;
      break;
    case 'google':
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords&response_type=code&state=admin_${Date.now()}`;
      break;
    case 'tiktok':
      oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=admin_${Date.now()}`;
      break;
    case 'shopify':
      oauthUrl = `https://${process.env.SHOPIFY_SHOP_DOMAIN}.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_orders,read_products,read_customers&redirect_uri=${encodeURIComponent(redirectUri)}&state=admin_${Date.now()}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  return NextResponse.redirect(oauthUrl);
}
