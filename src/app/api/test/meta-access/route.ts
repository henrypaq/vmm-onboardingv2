import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, adAccountId } = await request.json();
    
    if (!clientId || !adAccountId) {
      return NextResponse.json(
        { error: 'Client ID and Ad Account ID are required' },
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

    // Check if the connection has ads permissions
    const hasAdsPermission = connection.scopes?.some((scope: string) => 
      scope.includes('ads_read') || scope.includes('ads_management')
    );

    if (!hasAdsPermission) {
      return NextResponse.json(
        { error: 'Missing permission: ads_read or ads_management required' },
        { status: 403 }
      );
    }

    // Test Meta Graph API access
    try {
      const graphApiUrl = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?access_token=${connection.access_token}&limit=5`;
      
      console.log('[Meta Test] Testing API access for ad account:', adAccountId);
      
      const response = await fetch(graphApiUrl);
      const data = await response.json();

      if (!response.ok) {
        console.error('[Meta Test] Graph API error:', data);
        return NextResponse.json(
          { 
            error: `Meta Graph API error: ${data.error?.message || 'Unknown error'}`,
            details: data.error
          },
          { status: 400 }
        );
      }

      // Extract campaign names from the response
      const campaigns = data.data || [];
      const campaignNames = campaigns.slice(0, 3).map((campaign: any) => 
        campaign.name || `Campaign ${campaign.id}`
      );

      return NextResponse.json({
        success: true,
        message: `Successfully fetched ${campaigns.length} campaigns`,
        campaigns: campaignNames,
        totalCampaigns: campaigns.length
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
