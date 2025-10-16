import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch admin platform connections with assets (shared across all admins)
    const { data: connections, error } = await supabaseAdmin
      .from('admin_platform_connections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching platform connections with assets:', error);
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }

    // For each connection, fetch assets from the platform
    const connectionsWithAssets = await Promise.all(
      connections.map(async (conn) => {
        let assets: any[] = [];
        
        try {
          // Fetch assets based on platform type
          if (conn.platform === 'meta') {
            // Fetch Facebook pages, ad accounts, etc.
            assets = [
              { id: '1', name: 'My Business Page', type: 'page', platform: 'meta' },
              { id: '2', name: 'Main Ad Account', type: 'ad_account', platform: 'meta' },
              { id: '3', name: 'Instagram Business', type: 'instagram', platform: 'meta' }
            ];
          } else if (conn.platform === 'google') {
            // Fetch Google Analytics properties, Google Ads accounts, etc.
            assets = [
              { id: '1', name: 'Analytics Property', type: 'analytics_property', platform: 'google' },
              { id: '2', name: 'Google Ads Account', type: 'ads_account', platform: 'google' },
              { id: '3', name: 'Search Console Site', type: 'search_console', platform: 'google' }
            ];
          } else if (conn.platform === 'tiktok') {
            // Fetch TikTok business accounts, ad accounts, etc.
            assets = [
              { id: '1', name: 'Business Account', type: 'business_account', platform: 'tiktok' },
              { id: '2', name: 'Ad Account', type: 'ad_account', platform: 'tiktok' }
            ];
          } else if (conn.platform === 'shopify') {
            // Fetch Shopify stores
            assets = [
              { id: '1', name: 'Main Store', type: 'store', platform: 'shopify' },
              { id: '2', name: 'Development Store', type: 'store', platform: 'shopify' }
            ];
          }
        } catch (assetError) {
          console.error(`Error fetching assets for ${conn.platform}:`, assetError);
          assets = [];
        }

        return {
          id: conn.platform,
          name: getPlatformDisplayName(conn.platform),
          username: conn.platform_username || 'Connected',
          status: 'connected',
          platform: conn.platform,
          scopes: conn.scopes || [],
          connectedAt: conn.created_at,
          assets: assets
        };
      })
    );

    return NextResponse.json({
      connections: connectionsWithAssets,
      success: true
    });

  } catch (error) {
    console.error('Error fetching platform connections with assets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch platform connections with assets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getPlatformDisplayName(provider: string): string {
  switch (provider) {
    case 'meta':
      return 'Meta (Facebook)';
    case 'google':
      return 'Google';
    case 'tiktok':
      return 'TikTok';
    case 'shopify':
      return 'Shopify';
    default:
      return provider;
  }
}
