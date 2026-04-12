import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { fetchPlatformAssets, discoverGoogleAssets } from '@/lib/oauth/oauth-utils';
import { getOnboardingLinkByToken } from '@/lib/db/database';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('=== PLATFORM ASSETS API START ===');

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const token = searchParams.get('token');
    const clientId = searchParams.get('clientId'); // Legacy fallback

    console.log('Assets API request:', { platform, token: token ? '[present]' : null, clientId });

    if (!platform || (!token && !clientId)) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: platform and token (or clientId)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let connection: any = null;

    // ── PRIMARY PATH: token-based lookup ──────────────────────────────────────
    // Searches ALL in-progress requests for the link, finds the one with OAuth
    // data for this platform. This is robust against store-oauth writing to a
    // different request than the one the GET /onboarding/request returns.
    if (token) {
      console.log('[Assets API] Using token-based lookup for platform:', platform);

      const link = await getOnboardingLinkByToken(token);
      if (!link) {
        console.log('[Assets API] Link not found for token');
        return NextResponse.json({ error: 'Invalid onboarding token' }, { status: 404 });
      }

      // Get all in-progress requests for this link (no time window — we need
      // whatever store-oauth wrote, even if it was > 5 minutes ago)
      const { data: allRequests, error: requestsError } = await supabase
        .from('onboarding_requests')
        .select('id, platform_connections, client_id')
        .eq('link_id', link.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      console.log('[Assets API] Found', allRequests?.length ?? 0, 'in-progress requests for link');

      if (allRequests && allRequests.length > 0) {
        // Find the request that actually has the OAuth token for this platform
        for (const req of allRequests) {
          const platformData = req.platform_connections?.[platform];
          if (platformData?.access_token) {
            console.log('[Assets API] Found OAuth data in request:', req.id);
            connection = {
              id: req.id,
              client_id: req.client_id,
              platform,
              access_token: platformData.access_token,
              refresh_token: platformData.refresh_token ?? null,
              token_expires_at: platformData.token_expires_at ?? null,
              scopes: platformData.scopes ?? [],
              assets: platformData.assets ?? [],
              platform_user_id: platformData.platform_user_id ?? '',
              platform_username: platformData.platform_username ?? '',
              is_active: true,
            };
            break;
          }
        }
      }

      // If not found in onboarding_requests, check client_platform_connections
      // (e.g. if the client already completed onboarding before)
      if (!connection) {
        console.log('[Assets API] No OAuth data in onboarding requests, checking client_platform_connections...');
        // Find client_id from any request that has one
        const requestWithClientId = allRequests?.find(r => r.client_id);
        if (requestWithClientId?.client_id) {
          const { data: clientConn } = await supabase
            .from('client_platform_connections')
            .select('*')
            .eq('client_id', requestWithClientId.client_id)
            .eq('platform', platform)
            .eq('is_active', true)
            .single();
          if (clientConn) {
            connection = clientConn;
            console.log('[Assets API] Found connection in client_platform_connections');
          }
        }
      }
    }

    // ── LEGACY FALLBACK: clientId-based lookup ────────────────────────────────
    if (!connection && clientId) {
      console.log('[Assets API] Falling back to clientId-based lookup:', clientId);

      // First try as an onboarding request ID
      const { data: onboardingRequest } = await supabase
        .from('onboarding_requests')
        .select('id, client_id, platform_connections')
        .eq('id', clientId)
        .single();

      if (onboardingRequest) {
        const platformData = onboardingRequest.platform_connections?.[platform];
        if (platformData?.access_token) {
          connection = {
            id: onboardingRequest.id,
            client_id: onboardingRequest.client_id,
            platform,
            access_token: platformData.access_token,
            refresh_token: platformData.refresh_token ?? null,
            token_expires_at: platformData.token_expires_at ?? null,
            scopes: platformData.scopes ?? [],
            assets: platformData.assets ?? [],
            platform_user_id: platformData.platform_user_id ?? '',
            platform_username: platformData.platform_username ?? '',
            is_active: true,
          };
          console.log('[Assets API] Found OAuth data via clientId in onboarding request');
        } else if (onboardingRequest.client_id) {
          // Try client_platform_connections with the actual client_id
          const { data: clientConn } = await supabase
            .from('client_platform_connections')
            .select('*')
            .eq('client_id', onboardingRequest.client_id)
            .eq('platform', platform)
            .eq('is_active', true)
            .single();
          if (clientConn) {
            connection = clientConn;
            console.log('[Assets API] Found connection via client_id in client_platform_connections');
          }
        }
      }

      // Last resort: clientId might be an actual client UUID
      if (!connection) {
        const { data: clientConn } = await supabase
          .from('client_platform_connections')
          .select('*')
          .eq('client_id', clientId)
          .eq('platform', platform)
          .eq('is_active', true)
          .single();
        if (clientConn) {
          connection = clientConn;
          console.log('[Assets API] Found connection directly via clientId');
        }
      }
    }

    if (!connection) {
      console.log('[Assets API] Platform connection not found for platform:', platform);
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    console.log('[Assets API] Using connection:', {
      id: connection.id,
      platform: connection.platform,
      has_access_token: !!connection.access_token,
      stored_assets_count: connection.assets?.length ?? 0,
    });

    // ── FETCH / RETURN ASSETS ─────────────────────────────────────────────────
    let assets: any[] = [];

    switch (platform) {
      case 'meta':
        console.log('[Assets API] Fetching Meta assets...');
        try {
          assets = await fetchPlatformAssets('meta', connection.access_token, connection.scopes ?? []);
          console.log('[Assets API] Meta assets count:', assets.length);
        } catch (error) {
          console.error('[Assets API] Error fetching Meta assets:', error);
          assets = connection.assets ?? [];
        }
        break;

      case 'google':
        console.log('[Assets API] Resolving Google assets...');
        // Prefer stored assets (already fetched during OAuth callback)
        if (connection.assets && connection.assets.length > 0) {
          assets = connection.assets;
          console.log('[Assets API] Using', assets.length, 'stored Google assets');
        } else {
          console.log('[Assets API] No stored assets — fetching fresh from Google APIs...');
          try {
            assets = await discoverGoogleAssets(connection.access_token, connection.client_id ?? 'unknown');
            console.log('[Assets API] Discovered', assets.length, 'Google assets');
          } catch (error) {
            console.error('[Assets API] Error discovering Google assets:', error);
            assets = [];
          }
        }
        break;

      default:
        console.log('[Assets API] Unsupported platform:', platform);
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    console.log('=== PLATFORM ASSETS API SUCCESS — returning', assets.length, 'assets ===');
    return NextResponse.json({ assets });

  } catch (error: any) {
    console.error('=== PLATFORM ASSETS API ERROR ===', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: error.message },
      { status: 500 }
    );
  }
}
