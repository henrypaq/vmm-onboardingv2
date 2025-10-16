import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  console.log('=== SHOPIFY DATA SAVE API START ===');
  
  try {
    const { clientId, storeDomain, collaboratorCode } = await request.json();
    
    console.log('Shopify data save request:', { clientId, storeDomain, collaboratorCode });

    // Validate required fields
    if (!clientId || !storeDomain || !collaboratorCode) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, storeDomain, collaboratorCode' },
        { status: 400 }
      );
    }

    // Validate store domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.myshopify\.com$/;
    if (!domainRegex.test(storeDomain)) {
      return NextResponse.json(
        { error: 'Invalid store domain format. Must be in format: storename.myshopify.com' },
        { status: 400 }
      );
    }

    // Validate collaborator code format (accept 4-8 characters, or 'none')
    if (collaboratorCode !== 'none' && (collaboratorCode.length < 4 || collaboratorCode.length > 8)) {
      return NextResponse.json(
        { error: 'Invalid collaborator code format. Must be 4-8 characters or "none"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    console.log('Supabase admin client created successfully');
    
    // Find the onboarding request
    const { data: onboardingRequest, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .select('id, platform_connections')
      .eq('id', clientId)
      .single();

    console.log('Onboarding request lookup:', { 
      clientId, 
      onboardingRequest, 
      onboardingError
    });

    if (onboardingError || !onboardingRequest) {
      return NextResponse.json(
        { error: 'Onboarding request not found' },
        { status: 404 }
      );
    }

    // Extract store ID from domain
    const storeId = storeDomain.replace('.myshopify.com', '');
    
    // Update the onboarding request with Shopify data
    const shopifyData = {
      store_id: storeId,
      store_domain: storeDomain,
      collaborator_code: collaboratorCode,
      connected_at: new Date().toISOString()
    };

    // Update platform_connections field to include Shopify data
    const currentPlatformConnections = onboardingRequest.platform_connections || {};
    const updatedPlatformConnections = {
      ...currentPlatformConnections,
      shopify: shopifyData
    };

    const { data: updatedRequest, error: updateError } = await supabase
      .from('onboarding_requests')
      .update({
        platform_connections: updatedPlatformConnections,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update onboarding request with Shopify data:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Shopify data', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('=== SHOPIFY DATA SAVE API SUCCESS ===');
    console.log('Shopify data saved successfully:', shopifyData);

    return NextResponse.json({
      success: true,
      message: 'Shopify connection saved successfully',
      data: {
        store_id: storeId,
        store_domain: storeDomain,
        collaborator_code: collaboratorCode,
        saved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('=== SHOPIFY DATA SAVE API ERROR ===');
    console.error('Shopify data save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
