import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, createOnboardingRequest, updateOnboardingRequest, getClientByEmail, upsertClientPlatformConnectionByStableId } from '@/lib/db/database';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token, platform, accessToken, refreshToken, tokenExpiresAt, scopes, platformUserId, platformUsername, client_email, client_name, company_name, assets } = await request.json();
    
    console.log('[Store OAuth] ===========================================');
    console.log('[Store OAuth] RECEIVED OAUTH DATA');
    console.log('[Store OAuth] Platform:', platform);
    console.log('[Store OAuth] Assets count:', assets?.length || 0);
    console.log('[Store OAuth] Assets details:', assets?.map((a: any) => ({ id: a.id, name: a.name, type: a.type })));
    console.log('[Store OAuth] Full assets array:', assets);
    console.log('[Store OAuth] ===========================================');
    
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

    // Check if onboarding request already exists (get most recent in_progress request)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existingRequests, error: findError } = await supabaseAdmin
      .from('onboarding_requests')
      .select('*')
      .eq('link_id', link.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const existingRequest = existingRequests || null;
    
    console.log('[Store OAuth] ===========================================');
    console.log('[Store OAuth] CHECKING FOR EXISTING REQUEST');
    console.log('[Store OAuth] ===========================================');
    console.log('[Store OAuth] Existing request found:', !!existingRequest);
    if (existingRequest) {
      console.log('[Store OAuth] Existing request ID:', existingRequest.id);
      console.log('[Store OAuth] Existing request client_email:', existingRequest.client_email);
      console.log('[Store OAuth] Existing request client_name:', existingRequest.client_name);
      console.log('[Store OAuth] Existing request company_name:', existingRequest.company_name);
    }
    console.log('[Store OAuth] ===========================================');
    
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
      // Preserve existing client info if it exists
      const updatedConnections = {
        ...existingRequest.platform_connections,
        [platform]: oauthData
      };
      
      console.log('[Store OAuth] Updating existing request, preserving client info...');
      
      await updateOnboardingRequest(existingRequest.id, {
        platform_connections: updatedConnections,
        // If scopes were passed but granted_permissions lacks this platform, initialize it
        granted_permissions: {
          ...existingRequest.granted_permissions,
          ...(scopes && scopes.length ? { [platform]: scopes } : {})
        },
        // Preserve client info if it exists
        client_email: existingRequest.client_email || client_email || null,
        client_name: existingRequest.client_name || client_name || null,
        company_name: existingRequest.company_name || company_name || null,
      });
      
      console.log('[Store OAuth] ✅ Updated existing request with OAuth data');
    } else {
      // Create new onboarding request with platform connection
      // Include client info if provided (from OAuth callback params)
      console.log('[Store OAuth] No existing request found, creating new one...');
      console.log('[Store OAuth] Client info from params:', { client_email, client_name, company_name });
      
      await createOnboardingRequest({
        link_id: link.id,
        platform_connections: {
          [platform]: oauthData
        },
        granted_permissions: scopes && scopes.length ? { [platform]: scopes } : {},
        status: 'in_progress',
        // Include client info if provided
        client_email: client_email || null,
        client_name: client_name || null,
        company_name: company_name || null,
      });
      
      console.log('[Store OAuth] ✅ Created new request with OAuth data');
    }

    // Also upsert into client_platform_connections immediately using stable id
    // NOTE: We do NOT create clients here - clients are only created when the full onboarding flow is completed
    // in the /api/onboarding/submit route. This ensures clients are only created after all platforms are connected.
    try {
      let clientId: string | undefined = existingRequest?.client_id;
      const email = existingRequest?.client_email || client_email;
      const name = existingRequest?.client_name || client_name;
      const company = existingRequest?.company_name || company_name;

      // Only use existing client ID if it exists - don't create new clients during OAuth flow
      if (!clientId && email) {
        const adminId = link.admin_id;
        const existingClient = await getClientByEmail(adminId, email);
        if (existingClient) {
          clientId = existingClient.id;
          console.log('[Store OAuth] Using existing client ID:', clientId);
        } else {
          // Don't create client here - wait for full flow completion
          console.log('[Store OAuth] No existing client found. Client will be created when onboarding flow completes.');
          clientId = undefined;
        }
      }

      if (clientId && platformUserId) {
        console.log('[Store OAuth] ===========================================');
        console.log('[Store OAuth] STORING CLIENT PLATFORM CONNECTION');
        console.log('[Store OAuth] Client ID:', clientId);
        console.log('[Store OAuth] Platform:', platform);
        console.log('[Store OAuth] Platform User ID:', platformUserId);
        console.log('[Store OAuth] Assets to store:', assets);
        console.log('[Store OAuth] ===========================================');
        
        await upsertClientPlatformConnectionByStableId({
          client_id: clientId,
          platform: platform as 'meta' | 'google' | 'tiktok' | 'shopify',
          platform_user_id: platformUserId,
          platform_username: platformUsername,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          scopes: scopes || [],
          assets: assets || [], // Store assets in client_platform_connections
          is_active: true,
        });
        
        console.log('[Store OAuth] Successfully stored client platform connection with assets');
        
        // Update the onboarding request with the client_id
        if (existingRequest) {
          console.log('[Store OAuth] Updating onboarding request with client_id:', clientId);
          await updateOnboardingRequest(existingRequest.id, {
            client_id: clientId
          });
        }
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
