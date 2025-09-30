import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, platform, assetId, assetType } = await request.json();
    
    if (!clientId || !platform || !assetId) {
      return NextResponse.json(
        { error: 'Client ID, platform, and asset ID are required' },
        { status: 400 }
      );
    }

    if (platform !== 'meta') {
      return NextResponse.json(
        { error: 'This endpoint only supports Meta platform' },
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

    // Test Meta Graph API access based on asset type
    try {
      let testResult;
      
      if (assetType === 'ad_account') {
        testResult = await testMetaAdAccount(connection.access_token, assetId);
      } else if (assetType === 'page') {
        testResult = await testMetaPage(connection.access_token, assetId);
      } else if (assetType === 'catalog') {
        testResult = await testMetaCatalog(connection.access_token, assetId);
      } else {
        // Generic asset test
        testResult = await testMetaGeneric(connection.access_token, assetId);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully tested Meta ${assetType || 'asset'} access`,
        assetData: testResult
      });

    } catch (apiError) {
      console.error('[Meta Test] API call failed:', apiError);
      return NextResponse.json(
        { 
          error: 'Failed to call Meta Graph API',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Meta Test] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function testMetaAdAccount(accessToken: string, adAccountId: string) {
  // Test ad account by fetching campaigns
  const response = await fetch(`https://graph.facebook.com/v19.0/${adAccountId}/campaigns?access_token=${accessToken}&limit=5`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Ad account access failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const campaigns = data.data || [];
  
  return {
    adAccountId: adAccountId,
    campaignCount: campaigns.length,
    campaigns: campaigns.slice(0, 3).map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name || `Campaign ${campaign.id}`
    }))
  };
}

async function testMetaPage(accessToken: string, pageId: string) {
  // Test page by fetching basic info
  const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=name,category,followers_count&access_token=${accessToken}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Page access failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    pageId: pageId,
    name: data.name || 'Unknown Page',
    category: data.category || 'Unknown',
    followersCount: data.followers_count || 0
  };
}

async function testMetaCatalog(accessToken: string, catalogId: string) {
  // Test catalog by fetching basic info
  const response = await fetch(`https://graph.facebook.com/v19.0/${catalogId}?fields=name,product_count&access_token=${accessToken}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Catalog access failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    catalogId: catalogId,
    name: data.name || 'Unknown Catalog',
    productCount: data.product_count || 0
  };
}

async function testMetaGeneric(accessToken: string, assetId: string) {
  // Generic test - just try to get basic info
  const response = await fetch(`https://graph.facebook.com/v19.0/${assetId}?fields=name&access_token=${accessToken}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Asset access failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    assetId: assetId,
    name: data.name || 'Unknown Asset',
    type: 'generic'
  };
}
