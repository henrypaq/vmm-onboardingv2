import { NextRequest } from 'next/server';
import { getSupabaseClient, executeSupabaseOperation, handleApiRoute, safeJsonParse } from '@/lib/api/api-utils';

export async function POST(request: NextRequest) {
  return handleApiRoute('Save Selected Assets', async () => {
    const { clientId, platform, selectedAssets } = await safeJsonParse<{
      clientId: string;
      platform: string;
      selectedAssets: any;
    }>(request);

    if (!clientId || !platform || !selectedAssets) {
      throw new Error('Missing required fields: clientId, platform, selectedAssets');
    }

    const supabase = await getSupabaseClient();

    // Get the onboarding request
    const onboardingRequest = await executeSupabaseOperation(
      () => supabase
        .from('onboarding_requests')
        .select('platform_connections, client_id')
        .eq('id', clientId)
        .single(),
      'Fetch onboarding request'
    );

    // Update the platform_connections with selected assets
    const currentConnections = onboardingRequest.platform_connections || {};
    currentConnections[platform] = {
      ...currentConnections[platform],
      selected_assets: selectedAssets
    };

    await executeSupabaseOperation(
      () => supabase
        .from('onboarding_requests')
        .update({ 
          platform_connections: currentConnections,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId),
      'Update onboarding request'
    );

    // Also update the client_platform_connections table with selected assets
    if (onboardingRequest.client_id) {
      try {
        const platformConnection = await executeSupabaseOperation(
          () => supabase
            .from('client_platform_connections')
            .select('*')
            .eq('client_id', onboardingRequest.client_id)
            .eq('platform', platform)
            .eq('is_active', true)
            .single(),
          'Fetch platform connection'
        );

        await executeSupabaseOperation(
          () => supabase
            .from('client_platform_connections')
            .update({
              assets: selectedAssets,
              updated_at: new Date().toISOString()
            })
            .eq('id', platformConnection.id),
          'Update platform connection'
        );
      } catch (error) {
        // Don't fail the request if platform connection update fails
        console.warn('Failed to update platform connection:', error);
      }
    }

    return { 
      message: 'Selected assets saved successfully',
      selectedAssets 
    };
  });
}
