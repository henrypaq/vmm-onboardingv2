import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, platform, selectedAssets } = await request.json();

    if (!clientId || !platform || !selectedAssets) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, platform, selectedAssets' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the onboarding request
    const { data: onboardingRequest, error: requestError } = await supabase
      .from('onboarding_requests')
      .select('platform_connections')
      .eq('id', clientId)
      .single();

    if (requestError || !onboardingRequest) {
      return NextResponse.json(
        { error: 'Onboarding request not found' },
        { status: 404 }
      );
    }

    // Update the platform_connections with selected assets
    const currentConnections = onboardingRequest.platform_connections || {};
    currentConnections[platform] = {
      ...currentConnections[platform],
      selected_assets: selectedAssets
    };

    const { error: updateError } = await supabase
      .from('onboarding_requests')
      .update({ 
        platform_connections: currentConnections,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating onboarding request:', updateError);
      return NextResponse.json(
        { error: 'Failed to save selected assets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Selected assets saved successfully'
    });

  } catch (error) {
    console.error('Error saving selected assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
