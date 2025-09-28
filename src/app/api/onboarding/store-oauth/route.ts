import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, createOnboardingRequest, updateOnboardingRequest } from '@/lib/db/database';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token, platform, accessToken, refreshToken, tokenExpiresAt, scopes, platformUserId, platformUsername } = await request.json();
    
    if (!token || !platform || !accessToken) {
      return NextResponse.json(
        { error: 'Token, platform, and access token are required' },
        { status: 400 }
      );
    }

    // Get the onboarding link
    const link = await getOnboardingLinkByToken(token);
    if (!link) {
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }

    // Check if onboarding request already exists
    const existingRequest = await getOnboardingRequestByLinkId(link.id);
    
    const oauthData = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
      scopes: scopes || [],
      platform_user_id: platformUserId,
      platform_username: platformUsername
    };

    if (existingRequest) {
      // Update existing request with new platform connection
      const updatedConnections = {
        ...existingRequest.platform_connections,
        [platform]: oauthData
      };
      
      await updateOnboardingRequest(existingRequest.id, {
        platform_connections: updatedConnections
      });
    } else {
      // Create new onboarding request with platform connection
      await createOnboardingRequest({
        link_id: link.id,
        platform_connections: {
          [platform]: oauthData
        },
        granted_permissions: {},
        status: 'in_progress'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Store OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to store OAuth data' },
      { status: 500 }
    );
  }
}

async function getOnboardingRequestByLinkId(linkId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('onboarding_requests')
    .select('*')
    .eq('link_id', linkId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows found
    }
    console.error('Error fetching onboarding request:', error);
    return null;
  }

  return data;
}
