import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, platform, assetId, assetType } = await request.json();

    if (!clientId || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: clientId, platform' },
        { status: 400 }
      );
    }

    if (platform !== 'google') {
      return NextResponse.json(
        { error: 'This endpoint only supports Google platform testing' },
        { status: 400 }
      );
    }

    console.log(`[Google Test API] Testing ${assetType || 'basic'} for client ${clientId}, asset ${assetId || 'none'}`);

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
    let summary: string;

    // If no assetId/assetType provided, or assetType is 'basic', fallback to userinfo
    if (!assetId || !assetType || assetType === 'basic') {
      console.log('[Google Test API] No asset specified or basic profile test, using userinfo fallback');
      apiUrl = 'https://openidconnect.googleapis.com/v1/userinfo';
      summary = 'Basic profile information from Google account';
      
      try {
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${connection.access_token}` }
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: errorText, status: response.status },
            summary: `Failed to fetch user info: ${response.status}`
          });
        }

        const data = await response.json();
        return NextResponse.json({
          success: true,
          apiUrl,
          json: data,
          summary: `User: ${data.name || data.email || 'Unknown'}, Email: ${data.email || 'N/A'}`
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          apiUrl,
          json: { error: error instanceof Error ? error.message : 'Unknown error' },
          summary: 'Failed to fetch user info'
        });
      }
    }

    // Set up API call based on asset type
    switch (assetType) {
      case 'ads_account': {
        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!devToken) {
          return NextResponse.json({
            success: false,
            apiUrl: 'N/A',
            json: { error: 'Google Ads Developer Token not configured' },
            summary: 'Google Ads API requires developer token to test'
          });
        }
        
        apiUrl = 'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers';
        summary = 'Google Ads accessible customers list';
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${connection.access_token}`,
              'developer-token': devToken
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Google Ads customers: ${response.status}`
            });
          }

          const data = await response.json();
          return NextResponse.json({
            success: true,
            apiUrl,
            json: data,
            summary: `Found ${data.resourceNames?.length || 0} accessible Google Ads customers`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Google Ads customers'
          });
        }
      }

      case 'analytics_property': {
        apiUrl = 'https://analyticsadmin.googleapis.com/v1/accountSummaries';
        summary = 'Analytics account summaries';
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${connection.access_token}` }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Analytics summaries: ${response.status}`
            });
          }

          const data = await response.json();
          const matchingProperty = data.accountSummaries
            ?.flatMap((summary: any) => summary.propertySummaries || [])
            .find((property: any) => property.property.replace('properties/', '') === assetId);
          
          return NextResponse.json({
            success: true,
            apiUrl,
            json: matchingProperty || data,
            summary: matchingProperty 
              ? `Analytics Property: ${matchingProperty.displayName || assetId}`
              : `Found ${data.accountSummaries?.length || 0} Analytics accounts`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Analytics data'
          });
        }
      }

      case 'business_profile_location': {
        apiUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1/locations?readMask=name,storeCode,websiteUri';
        summary = 'Business Profile locations';
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${connection.access_token}` }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Business Profile locations: ${response.status}`
            });
          }

          const data = await response.json();
          const matchingLocation = data.locations?.find((location: any) => 
            location.name.replace('locations/', '') === assetId
          );
          
          return NextResponse.json({
            success: true,
            apiUrl,
            json: matchingLocation || data,
            summary: matchingLocation
              ? `Business Profile: ${matchingLocation.title || assetId}`
              : `Found ${data.locations?.length || 0} Business Profile locations`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Business Profile data'
          });
        }
      }

      case 'business_account': {
        apiUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
        summary = 'Business Profile accounts';
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${connection.access_token}` }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Business Profile accounts: ${response.status}`
            });
          }

          const data = await response.json();
          const matchingAccount = data.accounts?.find((account: any) => 
            account.name.replace('accounts/', '') === assetId
          );
          
          return NextResponse.json({
            success: true,
            apiUrl,
            json: matchingAccount || data,
            summary: matchingAccount
              ? `Business Profile Account: ${matchingAccount.accountName || assetId}`
              : `Found ${data.accounts?.length || 0} Business Profile accounts`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Business Profile account data'
          });
        }
      }

      case 'tagmanager_account': {
        apiUrl = 'https://www.googleapis.com/tagmanager/v2/accounts';
        summary = 'Tag Manager accounts and containers';
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${connection.access_token}` }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Tag Manager accounts: ${response.status}`
            });
          }

          const data = await response.json();
          const matchingAccount = data.account?.find((account: any) => account.accountId === assetId);
          
          return NextResponse.json({
            success: true,
            apiUrl,
            json: matchingAccount || data,
            summary: matchingAccount
              ? `Tag Manager Account: ${matchingAccount.name || assetId}`
              : `Found ${data.account?.length || 0} Tag Manager accounts`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Tag Manager data'
          });
        }
      }

      case 'searchconsole_site': {
        apiUrl = 'https://www.googleapis.com/webmasters/v3/sites';
        summary = 'Search Console sites';
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${connection.access_token}` }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Search Console sites: ${response.status}`
            });
          }

          const data = await response.json();
          const matchingSite = data.siteEntry?.find((site: any) => site.siteUrl === assetId);
          
          return NextResponse.json({
            success: true,
            apiUrl,
            json: matchingSite || data,
            summary: matchingSite
              ? `Search Console Site: ${matchingSite.siteUrl}`
              : `Found ${data.siteEntry?.length || 0} Search Console sites`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Search Console data'
          });
        }
      }

      case 'merchant_account': {
        apiUrl = 'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo';
        summary = 'Merchant Center account information';
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${connection.access_token}` }
          });

          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
              success: false,
              apiUrl,
              json: { error: errorText, status: response.status },
              summary: `Failed to fetch Merchant Center info: ${response.status}`
            });
          }

          const data = await response.json();
          const matchingAccount = data.accountIdentifiers?.find((account: any) => account.merchantId === assetId);
          
          return NextResponse.json({
            success: true,
            apiUrl,
            json: matchingAccount || data,
            summary: matchingAccount
              ? `Merchant Center Account: ${matchingAccount.merchantId}`
              : `Found ${data.accountIdentifiers?.length || 0} Merchant Center accounts`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            apiUrl,
            json: { error: error instanceof Error ? error.message : 'Unknown error' },
            summary: 'Failed to fetch Merchant Center data'
          });
        }
      }

      default:
        return NextResponse.json({
          success: false,
          apiUrl: 'N/A',
          json: { error: `Unknown asset type: ${assetType}` },
          summary: `Unsupported asset type: ${assetType}`
        });
    }

  } catch (error) {
    console.error('[Google Test API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        apiUrl: 'N/A',
        json: { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        summary: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
