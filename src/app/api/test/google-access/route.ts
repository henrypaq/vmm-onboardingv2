import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, platform, assetId, assetType } = await request.json();

    if (!clientId || !platform || !assetId || !assetType) {
      return NextResponse.json(
        { error: 'Missing required parameters: clientId, platform, assetId, assetType' },
        { status: 400 }
      );
    }

    if (platform !== 'google') {
      return NextResponse.json(
        { error: 'This endpoint only supports Google platform testing' },
        { status: 400 }
      );
    }

    console.log(`[Google Test API] Testing ${assetType} for client ${clientId}, asset ${assetId}`);

    // Get client's Google connection
    const supabase = getSupabaseAdmin();
    const { data: connection, error: connectionError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', 'google')
      .single();

    if (connectionError || !connection) {
      console.error('[Google Test API] Connection not found:', connectionError);
      return NextResponse.json(
        { error: 'Google connection not found for this client' },
        { status: 404 }
      );
    }

    if (!connection.access_token) {
      return NextResponse.json(
        { error: 'No access token found for Google connection' },
        { status: 400 }
      );
    }

    let apiUrl: string;
    let description: string;
    let humanReadableLabel: string;

    // Set up API call based on asset type
    switch (assetType) {
      case 'ads_account':
        apiUrl = `https://googleads.googleapis.com/v14/customers/${assetId}/campaigns?access_token=${connection.access_token}&pageSize=5`;
        description = `Google Ads Campaigns for account ${assetId}`;
        humanReadableLabel = `Google Ads Campaigns (adwords) – This confirms we can fetch campaigns from the client's Google Ads account.`;
        break;
      
      case 'analytics_property':
        apiUrl = `https://analyticsadmin.googleapis.com/v1beta/properties/${assetId}?access_token=${connection.access_token}`;
        description = `Analytics Property Info for ${assetId}`;
        humanReadableLabel = `Analytics Property Info (analytics.readonly) – This confirms we can access the client's GA4 property details and configuration.`;
        break;
      
      case 'business_profile':
        apiUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${assetId}/locations?access_token=${connection.access_token}`;
        description = `Business Profile Locations for ${assetId}`;
        humanReadableLabel = `Business Profile Locations (business.manage) – This confirms we can access the client's business locations and profile information.`;
        break;
      
      case 'tag_manager':
        apiUrl = `https://tagmanager.googleapis.com/v2/accounts/${assetId}/containers?access_token=${connection.access_token}`;
        description = `Tag Manager Containers for ${assetId}`;
        humanReadableLabel = `Tag Manager Containers (tagmanager.readonly) – This confirms we can access the client's Tag Manager containers and configuration.`;
        break;
      
      case 'search_console':
        apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(assetId)}/searchAnalytics/query?access_token=${connection.access_token}`;
        description = `Search Console Analytics for ${assetId}`;
        humanReadableLabel = `Search Console Analytics (webmasters.readonly) – This confirms we can access search performance data for the client's website.`;
        break;
      
      case 'merchant_center':
        apiUrl = `https://shoppingcontent.googleapis.com/content/v2.1/${assetId}/products?access_token=${connection.access_token}&maxResults=5`;
        description = `Merchant Center Products for ${assetId}`;
        humanReadableLabel = `Merchant Center Products (content) – This confirms we can access the client's product catalog in Merchant Center.`;
        break;
      
      default:
        // Generic fallback
        apiUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${connection.access_token}`;
        description = `Google Token Info`;
        humanReadableLabel = `Google Token Validation – Basic token validation and scope information.`;
    }

    console.log(`[Google Test API] Making request to: ${apiUrl.replace(connection.access_token, '[TOKEN]')}`);

    // Make the API call
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // If specific API call failed, try token validation as fallback
      if (assetType !== 'generic') {
        console.log('[Google Test API] Specific API failed, trying token validation fallback...');
        const tokenUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${connection.access_token}`;
        const tokenResponse = await fetch(tokenUrl);
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          return NextResponse.json({
            success: true,
            description: `Token validation (${assetType} API not accessible)`,
            humanReadableLabel: `Token Validation – The specific ${assetType} API is not accessible, but the token is valid with scopes: ${tokenData.scope || 'unknown'}`,
            assetType,
            assetId,
            rawJson: tokenData,
            apiUrl: tokenUrl.replace(connection.access_token, '[TOKEN]')
          });
        }
      }
      
      const errorText = await response.text();
      console.error('[Google Test API] API call failed:', response.status, errorText);
      return NextResponse.json({
        success: false,
        description,
        humanReadableLabel: `Error testing ${assetType} – API call failed with status ${response.status}`,
        assetType,
        assetId,
        rawJson: { error: errorText, status: response.status },
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
      apiUrl: apiUrl.replace(connection.access_token, '[TOKEN]')
    });

  } catch (error) {
    console.error('[Google Test API] Error:', error);
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