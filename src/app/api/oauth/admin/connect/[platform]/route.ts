import { NextRequest, NextResponse } from 'next/server';
import { handleAdminOAuthCallback, generateOAuthUrl } from '@/lib/oauth/oauth-utils';
import { getPlatformDefinition } from '@/lib/platforms/platform-definitions';

// Admin OAuth connection endpoints
// These will be used when admins connect their platform accounts in the settings

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth callback
  if (code) {
    try {
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/admin/connect/${platform}`;
      const platformDef = getPlatformDefinition(platform);
      
      if (!platformDef) {
        throw new Error('Invalid platform');
      }

      // For now, use a hardcoded admin ID - in production, get from session
      const adminId = '00000000-0000-0000-0000-000000000001';
      
      await handleAdminOAuthCallback(
        platform,
        code,
        redirectUri,
        adminId,
        platformDef.oauthScopes
      );
      
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
  const platformDef = getPlatformDefinition(platform);
  
  if (!platformDef) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const stateParam = `admin_${Date.now()}`;
  const oauthUrl = generateOAuthUrl(
    platform,
    redirectUri,
    platformDef.oauthScopes,
    stateParam
  );

  return NextResponse.redirect(oauthUrl);
}
