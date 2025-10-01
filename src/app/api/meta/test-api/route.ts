import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, assetId, assetType } = await request.json();
    
    if (!clientId || !assetId || !assetType) {
      return NextResponse.json(
        { error: 'Client ID, asset ID, and asset type are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Look up the client's Meta connection
    const { data: connection, error: connectionError } = await supabase
      .from('client_platform_connections')
      .select('access_token, scopes, is_active')
      .eq('client_id', clientId)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'No active Meta connection found for this client' },
        { status: 404 }
      );
    }

    // Make the appropriate Graph API call based on asset type
    let apiUrl: string;
    let description: string;
    let humanReadableLabel: string;

    switch (assetType) {
      case 'ad_account':
        // Try campaigns first, fallback to account info
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}/campaigns?limit=3&access_token=${connection.access_token}`;
        description = `Ad Account Campaigns for ${assetId}`;
        humanReadableLabel = `Ad Account Campaigns (ads_management) – This confirms we can fetch and manage ad campaigns for the client's Ad Account.`;
        break;
      
      case 'page':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id,fan_count&access_token=${connection.access_token}`;
        description = `Page Info for ${assetId}`;
        humanReadableLabel = `Page Info (pages_show_list) – This confirms we can fetch the client's Page name, id, and fan count.`;
        break;
      
      case 'instagram_account':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=username,followers_count&access_token=${connection.access_token}`;
        description = `Instagram Account Info for ${assetId}`;
        humanReadableLabel = `Instagram Account Info (instagram_basic) – This confirms we can access the client's Instagram account username and follower count.`;
        break;
      
      case 'catalog':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id&access_token=${connection.access_token}`;
        description = `Catalog Info for ${assetId}`;
        humanReadableLabel = `Catalog Info (catalog_management) – This confirms we can access the client's product catalog information.`;
        break;
      
      case 'business_dataset':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,verification_status&access_token=${connection.access_token}`;
        description = `Business Manager Info for ${assetId}`;
        humanReadableLabel = `Business Manager Info (business_management) – This confirms we can access the client's Business Manager data and verification status.`;
        break;
      
      case 'page_posts':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}/posts?limit=3&fields=id,message,created_time&access_token=${connection.access_token}`;
        description = `Page Posts for ${assetId}`;
        humanReadableLabel = `Page Posts (pages_manage_posts) – This confirms the app can fetch and manage posts on the client's Page.`;
        break;
      
      default:
        // Generic fallback
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id&access_token=${connection.access_token}`;
        description = `Generic Asset Info for ${assetId}`;
        humanReadableLabel = `Generic Asset Info – Basic asset information access test.`;
    }

    console.log(`[Meta Test API] Making request to: ${apiUrl.replace(connection.access_token, '[TOKEN]')}`);

    // For page posts, we need to get a page access token first
    let finalApiUrl = apiUrl;
    if (assetType === 'page_posts') {
      try {
        const pageTokenUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=access_token&access_token=${connection.access_token}`;
        console.log(`[Meta Test API] Getting page token from: ${pageTokenUrl.replace(connection.access_token, '[TOKEN]')}`);
        
        const pageTokenResponse = await fetch(pageTokenUrl);
        if (pageTokenResponse.ok) {
          const pageTokenData = await pageTokenResponse.json();
          if (pageTokenData.access_token) {
            // Use the page access token for posts
            finalApiUrl = `https://graph.facebook.com/v19.0/${assetId}/posts?limit=3&fields=id,message,created_time&access_token=${pageTokenData.access_token}`;
            console.log(`[Meta Test API] Using page token for posts: ${finalApiUrl.replace(pageTokenData.access_token, '[PAGE_TOKEN]')}`);
            humanReadableLabel = `Page Posts (pages_manage_posts) – This confirms the app can fetch and manage posts on the client's Page using page access token.`;
          } else {
            console.warn('[Meta Test API] No page access token in response, using user token');
          }
        } else {
          console.warn('[Meta Test API] Failed to get page access token, using user token');
        }
      } catch (error) {
        console.warn('[Meta Test API] Error getting page token, using user token:', error);
      }
    }

    // Make the API call
    const response = await fetch(finalApiUrl);
    
    if (!response.ok) {
      // If campaigns call failed for ad account, try account info instead
      if (assetType === 'ad_account' && response.status === 400) {
        const fallbackUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id,account_status&access_token=${connection.access_token}`;
        console.log(`[Meta Test API] Campaigns failed, trying account info: ${fallbackUrl.replace(connection.access_token, '[TOKEN]')}`);
        
        const fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return NextResponse.json({
            success: true,
            description: `Ad Account Info for ${assetId} (campaigns not accessible)`,
            humanReadableLabel: `Ad Account Info (ads_management) – This confirms we can access the client's Ad Account basic information.`,
            assetType,
            assetId,
            rawJson: fallbackData,
            apiUrl: fallbackUrl.replace(connection.access_token, '[TOKEN]')
          });
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: `API call failed with status ${response.status}`,
        details: errorData,
        assetType,
        assetId,
        apiUrl: apiUrl.replace(connection.access_token, '[TOKEN]')
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      description,
      humanReadableLabel,
      assetType,
      assetId,
      rawJson: data,
      apiUrl: finalApiUrl.replace(/access_token=[^&]+/, 'access_token=[TOKEN]')
    });

  } catch (error) {
    console.error('[Meta Test API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
