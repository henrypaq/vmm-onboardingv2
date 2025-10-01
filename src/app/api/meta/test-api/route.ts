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

    switch (assetType) {
      case 'ad_account':
        // Try campaigns first, fallback to account info
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}/campaigns?limit=3&access_token=${connection.access_token}`;
        description = `Ad Account Campaigns for ${assetId}`;
        break;
      
      case 'page':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id,fan_count&access_token=${connection.access_token}`;
        description = `Page Info for ${assetId}`;
        break;
      
      case 'instagram_account':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=username,followers_count&access_token=${connection.access_token}`;
        description = `Instagram Account Info for ${assetId}`;
        break;
      
      case 'catalog':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id&access_token=${connection.access_token}`;
        description = `Catalog Info for ${assetId}`;
        break;
      
      case 'business_dataset':
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,verification_status&access_token=${connection.access_token}`;
        description = `Business Manager Info for ${assetId}`;
        break;
      
      default:
        // Generic fallback
        apiUrl = `https://graph.facebook.com/v19.0/${assetId}?fields=name,id&access_token=${connection.access_token}`;
        description = `Generic Asset Info for ${assetId}`;
    }

    console.log(`[Meta Test API] Making request to: ${apiUrl.replace(connection.access_token, '[TOKEN]')}`);

    // Make the API call
    const response = await fetch(apiUrl);
    
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
      assetType,
      assetId,
      rawJson: data,
      apiUrl: apiUrl.replace(connection.access_token, '[TOKEN]')
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
