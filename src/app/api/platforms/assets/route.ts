import { NextRequest } from 'next/server';
import { getSupabaseClient, executeSupabaseOperation, handleApiRoute, extractPlatformFromRequest, extractClientIdFromRequest } from '@/lib/api/api-utils';
import { fetchPlatformAssets } from '@/lib/oauth/oauth-utils';

export async function GET(request: NextRequest) {
  return handleApiRoute('Fetch Platform Assets', async () => {
    const platform = extractPlatformFromRequest(request);
    const clientId = extractClientIdFromRequest(request);
    
    const supabase = await getSupabaseClient();

    // Try to find platform connection for this client
    let connection = null;
    
    // First try to find it as an onboarding request
    try {
      const onboardingRequest = await executeSupabaseOperation(
        () => supabase
          .from('onboarding_requests')
          .select('id, client_id, platform_connections')
          .eq('id', clientId)
          .single(),
        'Fetch onboarding request'
      );

      if (onboardingRequest?.platform_connections?.[platform]?.access_token) {
        connection = {
          access_token: onboardingRequest.platform_connections[platform].access_token,
          scopes: onboardingRequest.platform_connections[platform].scopes || [],
          platform_user_id: onboardingRequest.platform_connections[platform].platform_user_id,
          platform_username: onboardingRequest.platform_connections[platform].platform_username,
          platform: platform,
          client_id: clientId,
        };
      }
    } catch (error) {
      // Onboarding request not found, try clients table
      try {
        const client = await executeSupabaseOperation(
          () => supabase
            .from('clients')
            .select('id')
            .eq('id', clientId)
            .single(),
          'Fetch client'
        );

        connection = await executeSupabaseOperation(
          () => supabase
            .from('client_platform_connections')
            .select('*')
            .eq('client_id', clientId)
            .eq('platform', platform)
            .eq('is_active', true)
            .single(),
          'Fetch platform connection'
        );
      } catch (clientError) {
        throw new Error('Platform connection not found');
      }
    }

    if (!connection) {
      throw new Error('Platform connection not found');
    }

    // Fetch assets based on platform
    const assets = await fetchPlatformAssets(platform, connection.access_token, connection.scopes || []);
    
    return { assets };
  });
}