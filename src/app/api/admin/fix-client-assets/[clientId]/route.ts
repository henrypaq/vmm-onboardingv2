import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { fetchPlatformAssets } from '@/lib/oauth/oauth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = getSupabaseAdmin();
    
    console.log(`[Fix Client Assets] Processing client: ${clientId}`);
    
    // Get the client's onboarding request
    const { data: requests, error } = await supabase
      .from('onboarding_requests')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Fix Client Assets] Error fetching request:', error);
      return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ error: 'No completed onboarding request found' }, { status: 404 });
    }

    const req = requests[0];
    console.log(`[Fix Client Assets] Found request: ${req.id}`);
    console.log(`[Fix Client Assets] Current platform connections:`, req.platform_connections);

    const platformConnections = req.platform_connections || {};
    let hasUpdates = false;
    const updatedConnections = { ...platformConnections };

    // Process each platform connection
    for (const [platform, connection] of Object.entries(platformConnections)) {
      if (connection && typeof connection === 'object' && 'access_token' in connection) {
        const accessToken = (connection as any).access_token;
        const scopes = (connection as any).scopes || [];
        
        console.log(`[Fix Client Assets] Processing platform: ${platform}`);
        console.log(`[Fix Client Assets] Scopes:`, scopes);
        console.log(`[Fix Client Assets] Current assets:`, (connection as any).assets);
        
        if (accessToken && scopes.length > 0) {
          try {
            // Re-fetch assets with current deduplication logic
            console.log(`[Fix Client Assets] Re-fetching assets for ${platform}...`);
            const freshAssets = await fetchPlatformAssets(platform, accessToken, scopes);
            console.log(`[Fix Client Assets] Fresh assets for ${platform}:`, freshAssets);
            
            // Update the connection with fresh assets
            updatedConnections[platform] = {
              ...connection,
              assets: freshAssets
            };
            hasUpdates = true;
            
            console.log(`[Fix Client Assets] Updated assets for ${platform}: ${freshAssets.length} assets`);
          } catch (assetError) {
            console.error(`[Fix Client Assets] Failed to fetch assets for ${platform}:`, assetError);
            return NextResponse.json({ 
              error: `Failed to fetch assets for ${platform}: ${assetError}` 
            }, { status: 500 });
          }
        }
      }
    }

    // Update the request if we have changes
    if (hasUpdates) {
      console.log(`[Fix Client Assets] Updating request ${req.id} with new assets`);
      
      const { error: updateError } = await supabase
        .from('onboarding_requests')
        .update({ platform_connections: updatedConnections })
        .eq('id', req.id);

      if (updateError) {
        console.error(`[Fix Client Assets] Failed to update request ${req.id}:`, updateError);
        return NextResponse.json({ 
          error: `Failed to update request: ${updateError}` 
        }, { status: 500 });
      }

      console.log(`[Fix Client Assets] Successfully updated request ${req.id}`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully fixed assets for client ${clientId}`,
        requestId: req.id,
        updatedConnections
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `No updates needed for client ${clientId}`,
        requestId: req.id
      });
    }

  } catch (error) {
    console.error('[Fix Client Assets] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix client assets' },
      { status: 500 }
    );
  }
}
