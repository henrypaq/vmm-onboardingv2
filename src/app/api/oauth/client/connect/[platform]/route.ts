import { NextRequest, NextResponse } from 'next/server';
import { handleClientOAuthCallback, generateOAuthUrl } from '@/lib/oauth/oauth-utils';
import { getPlatformDefinition } from '@/lib/platforms/platform-definitions';

// Client OAuth connection endpoints
// These will be used when clients connect their platform accounts during onboarding

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // const state = searchParams.get('state');
  const error = searchParams.get('error');
  const token = searchParams.get('token'); // Onboarding link token

  // Handle OAuth callback
  if (code && token) {
    try {
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/client/connect/${platform}`;
      const platformDef = getPlatformDefinition(platform);
      
      if (!platformDef) {
        throw new Error('Invalid platform');
      }

      await handleClientOAuthCallback(
        platform,
        code,
        redirectUri,
        token,
        platformDef.oauthScopes
      );
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}?connected=${platform}&step=${getNextStep(platform)}`);
    } catch (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}?error=oauth_failed`);
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}?error=oauth_denied`);
  }

  // Initiate OAuth flow
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/client/connect/${platform}`;
  const platformDef = getPlatformDefinition(platform);
  
  if (!platformDef) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const stateParam = `client_${Date.now()}`;
  const oauthUrl = generateOAuthUrl(
    platform,
    redirectUri,
    platformDef.oauthScopes,
    stateParam,
    { token: token || '' }
  );

  return NextResponse.redirect(oauthUrl);
}

function getNextStep(platform: string): number {
  const platforms = ['meta', 'google', 'tiktok', 'shopify'];
  const currentIndex = platforms.indexOf(platform);
  return currentIndex + 1; // Next step index
}
