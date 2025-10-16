import { NextRequest } from 'next/server';
import { getSupabaseClient, executeSupabaseOperation, handleApiRoute, safeJsonParse } from '@/lib/api/api-utils';

export async function POST(request: NextRequest) {
  return handleApiRoute('Test All Assets', async () => {
    const { clientId } = await safeJsonParse<{ clientId: string }>(request);

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const supabase = await getSupabaseClient();

    // Fetch all platform connections for this client
    const connections = await executeSupabaseOperation(
      () => supabase
        .from('client_platform_connections')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true),
      'Fetch platform connections'
    );

    const results: Record<string, string> = {};

    // Test each platform connection
    for (const connection of connections) {
      const platform = connection.platform;
      
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
            isSuccess = false;
        }

        results[platform] = isSuccess ? 'ok' : 'fail';
      } catch (error) {
        console.error(`Error testing ${platform}:`, error);
        results[platform] = 'fail';
      }
    }

    return results;
  });
}

async function testMetaConnection(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.data && Array.isArray(data.data);
    }
    
    return false;
  } catch (error) {
    console.error('Meta test error:', error);
    return false;
  }
}

async function testGoogleConnection(accessToken: string): Promise<boolean> {
  try {
    // Test token validity
    const tokenResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    if (!tokenResponse.ok) {
      return false;
    }
    
    // Test Tag Manager access
    const gtmResponse = await fetch(
      `https://www.googleapis.com/tagmanager/v2/accounts?access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    return gtmResponse.ok;
  } catch (error) {
    console.error('Google test error:', error);
    return false;
  }
}

async function testShopifyConnection(connection: any): Promise<boolean> {
  try {
    // Check if both store_id and collaborator_code exist
    const hasStoreId = connection.platform_user_id && connection.platform_user_id.trim() !== '';
    const hasCollaboratorCode = connection.platform_username && connection.platform_username.trim() !== '';
    
    return hasStoreId && hasCollaboratorCode;
  } catch (error) {
    console.error('Shopify test error:', error);
    return false;
  }
}
