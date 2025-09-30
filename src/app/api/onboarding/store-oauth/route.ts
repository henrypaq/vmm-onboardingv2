import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, createOnboardingRequest, updateOnboardingRequest, getClientByEmail, createClient as createClientRecord, upsertClientPlatformConnectionByStableId } from '@/lib/db/database';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token, platform, accessToken, refreshToken, tokenExpiresAt, scopes, platformUserId, platformUsername, client_email, client_name, company_name, assets } = await request.json();
    
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
      platform_username: platformUsername,
      assets: assets || []
    };

    if (existingRequest) {
      // Update existing request with new platform connection
      const updatedConnections = {
        ...existingRequest.platform_connections,
        [platform]: oauthData
      };
      
      await updateOnboardingRequest(existingRequest.id, {
        platform_connections: updatedConnections,
        // If scopes were passed but granted_permissions lacks this platform, initialize it
        granted_permissions: {
          ...existingRequest.granted_permissions,
          ...(scopes && scopes.length ? { [platform]: scopes } : {})
        }
      });
    } else {
      // Create new onboarding request with platform connection
      await createOnboardingRequest({
        link_id: link.id,
        platform_connections: {
          [platform]: oauthData
        },
        granted_permissions: scopes && scopes.length ? { [platform]: scopes } : {},
        status: 'in_progress'
      });
    }

    // Also upsert into client_platform_connections immediately using stable id
    try {
      let clientId: string | undefined = existingRequest?.client_id;
      const email = existingRequest?.client_email || client_email;
      const name = existingRequest?.client_name || client_name;
      const company = existingRequest?.company_name || company_name;

      if (!clientId && email) {
        const adminId = link.admin_id;
        const existingClient = await getClientByEmail(adminId, email);
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const newClient = await createClientRecord({
            admin_id: adminId,
            email,
            full_name: name,
            company_name: company,
            status: 'active' as const,
            last_onboarding_at: new Date().toISOString(),
          });
          clientId = newClient.id;
        }
      }

      if (clientId && platformUserId) {
        await upsertClientPlatformConnectionByStableId({
          client_id: clientId,
          platform: platform as 'meta' | 'google' | 'tiktok' | 'shopify',
          platform_user_id: platformUserId,
          platform_username: platformUsername,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          scopes: scopes || [],
          is_active: true,
        });
      }
    } catch (e) {
      console.warn('[Store OAuth] Upsert to client_platform_connections failed (will not block flow):', e);
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
