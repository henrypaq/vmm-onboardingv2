import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, excludePlatforms = [] } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch all platform connections for this client
    const { data: connections, error: connectionsError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (connectionsError) {
      console.error('[Test Assets] Error fetching connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch platform connections' },
        { status: 500 }
      );
    }

    // Filter out excluded platforms
    const filteredConnections = connections?.filter(conn => 
      !excludePlatforms.includes(conn.platform)
    ) || [];

    console.log('[Test Assets] Found connections:', connections?.length || 0);
    console.log('[Test Assets] Excluded platforms:', excludePlatforms);
    console.log('[Test Assets] Testing connections:', filteredConnections.length);

    const results: Record<string, string> = {};

    // Test each platform connection
    for (const connection of filteredConnections) {
      const platform = connection.platform;
      console.log(`[Test Assets] Testing ${platform} connection...`);

      try {
        let isSuccess = false;

        switch (platform) {
          case 'meta':
            isSuccess = await testMetaConnection(connection.access_token);
            break;
          case 'google':
            isSuccess = await testGoogleConnection(connection.access_token);
            break;
          case 'shopify':
            isSuccess = await testShopifyConnection(connection);
            break;
          default:
            console.log(`[Test Assets] Unsupported platform: ${platform}`);
            isSuccess = false;
        }

        results[platform] = isSuccess ? 'ok' : 'fail';
        console.log(`[Test Assets] ${platform} result:`, results[platform]);
      } catch (error) {
        console.error(`[Test Assets] Error testing ${platform}:`, error);
        results[platform] = 'fail';
      }
    }

    console.log('[Test Assets] Final results:', results);
    return NextResponse.json(results);

  } catch (error) {
    console.error('[Test Assets] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function testMetaConnection(accessToken: string): Promise<boolean> {
  try {
    console.log('[Test Assets] Testing Meta connection...');
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    console.log('[Test Assets] Meta response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const hasData = data.data && Array.isArray(data.data);
      console.log('[Test Assets] Meta has data:', hasData);
      return hasData;
    }
    
    return false;
  } catch (error) {
    console.error('[Test Assets] Meta test error:', error);
    return false;
  }
}

async function testGoogleConnection(accessToken: string): Promise<boolean> {
  try {
    console.log('[Test Assets] Testing Google connection...');
    
    // First test token validity
    const tokenResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    console.log('[Test Assets] Google token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      return false;
    }
    
    // Then test Tag Manager access
    const gtmResponse = await fetch(
      `https://www.googleapis.com/tagmanager/v2/accounts?access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    console.log('[Test Assets] Google GTM response status:', gtmResponse.status);
    return gtmResponse.ok;
  } catch (error) {
    console.error('[Test Assets] Google test error:', error);
    return false;
  }
}

async function testShopifyConnection(connection: any): Promise<boolean> {
  try {
    console.log('[Test Assets] Testing Shopify connection...');
    
    // Check if both store_id and collaborator_code exist
    const hasStoreId = connection.platform_user_id && connection.platform_user_id.trim() !== '';
    const hasCollaboratorCode = connection.platform_username && connection.platform_username.trim() !== '';
    
    console.log('[Test Assets] Shopify store_id exists:', hasStoreId);
    console.log('[Test Assets] Shopify collaborator_code exists:', hasCollaboratorCode);
    
    return hasStoreId && hasCollaboratorCode;
  } catch (error) {
    console.error('[Test Assets] Shopify test error:', error);
    return false;
  }
}
