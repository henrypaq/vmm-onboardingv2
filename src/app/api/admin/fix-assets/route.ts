import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { fetchPlatformAssets } from '@/lib/oauth/oauth-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get all onboarding requests with platform connections
    const { data: requests, error } = await supabase
      .from('onboarding_requests')
      .select('*')
      .not('platform_connections', 'is', null)
      .eq('status', 'completed');

    if (error) {
      console.error('[Fix Assets] Error fetching requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    console.log(`[Fix Assets] Found ${requests?.length || 0} requests to process`);

    let fixedCount = 0;
    const errors = [];

    for (const req of requests || []) {
      try {
        const platformConnections = req.platform_connections || {};
        let hasUpdates = false;
        const updatedConnections = { ...platformConnections };

        // Process each platform connection
        for (const [platform, connection] of Object.entries(platformConnections)) {
          if (connection && typeof connection === 'object' && 'access_token' in connection) {
            const accessToken = (connection as any).access_token;
            const scopes = (connection as any).scopes || [];
            
            if (accessToken && scopes.length > 0) {
              console.log(`[Fix Assets] Re-fetching assets for ${platform}...`);
              
              try {
                // Re-fetch assets with current deduplication logic
                const freshAssets = await fetchPlatformAssets(platform, accessToken, scopes);
                console.log(`[Fix Assets] Fresh assets for ${platform}:`, freshAssets);
                
                // Update the connection with fresh assets
                updatedConnections[platform] = {
                  ...connection,
                  assets: freshAssets
                };
                hasUpdates = true;
                
                console.log(`[Fix Assets] Updated assets for ${platform}: ${freshAssets.length} assets`);
              } catch (assetError) {
                console.warn(`[Fix Assets] Failed to fetch assets for ${platform}:`, assetError);
                errors.push(`Failed to fetch assets for ${platform}: ${assetError}`);
              }
            }
          }
        }

        // Update the request if we have changes
        if (hasUpdates) {
          const { error: updateError } = await supabase
            .from('onboarding_requests')
            .update({ platform_connections: updatedConnections })
            .eq('id', req.id);

          if (updateError) {
            console.error(`[Fix Assets] Failed to update request ${req.id}:`, updateError);
            errors.push(`Failed to update request ${req.id}: ${updateError}`);
          } else {
            fixedCount++;
            console.log(`[Fix Assets] Successfully updated request ${req.id}`);
          }
        }
      } catch (requestError) {
        console.error(`[Fix Assets] Error processing request ${req.id}:`, requestError);
        errors.push(`Error processing request ${req.id}: ${requestError}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fixed assets for ${fixedCount} requests`,
      fixedCount,
      totalRequests: requests?.length || 0,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[Fix Assets] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix assets' },
      { status: 500 }
    );
  }
}
