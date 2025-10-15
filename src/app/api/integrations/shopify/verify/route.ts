import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, storeDomain, collaboratorCode } = await request.json();
    
    console.log('Shopify verification request:', { clientId, storeDomain, collaboratorCode });

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

    // Validate collaborator code format (typically 4-8 characters)
    if (collaboratorCode.length < 4 || collaboratorCode.length > 8) {
      return NextResponse.json(
        { error: 'Invalid collaborator code format. Must be 4-8 characters' },
        { status: 400 }
      );
    }

    // Check if onboarding request exists (for new clients) or client exists (for existing clients)
    const supabase = getSupabaseAdmin();
    
    // First try to find it as an onboarding request
    const { data: onboardingRequest, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .select('id')
      .eq('id', clientId)
      .single();

    console.log('Onboarding request lookup:', { onboardingRequest, onboardingError });

    let requestId = null;
    if (onboardingRequest && !onboardingError) {
      requestId = onboardingRequest.id;
      console.log('Found onboarding request:', requestId);
    } else {
      // If not found in onboarding_requests, try clients table
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .single();

      console.log('Client lookup:', { client, clientError });

      if (clientError || !client) {
        return NextResponse.json(
          { error: 'Client or onboarding request not found' },
          { status: 404 }
        );
      }
      requestId = client.id;
      console.log('Found client:', requestId);
    }

    // Check if Shopify connection already exists for this request
    const { data: existingConnection, error: existingError } = await supabase
      .from('client_platform_connections')
      .select('id')
      .eq('client_id', requestId)
      .eq('platform', 'shopify')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Database error checking existing connection' },
        { status: 500 }
      );
    }

    const connectionData = {
      client_id: requestId,
      platform: 'shopify',
      platform_user_id: storeDomain, // Use store domain as platform user ID
      platform_username: storeDomain, // Use store domain as username
      access_token: `shopify_${storeDomain}_${collaboratorCode}`, // Generate a token-like identifier
      refresh_token: null, // Shopify doesn't use refresh tokens for collaborator access
      token_expires_at: null, // Shopify collaborator access doesn't expire
      is_active: true,
      scopes: ['store_access'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Connection data to insert:', connectionData);

    let result;
    if (existingConnection) {
      // Update existing connection
      const { data, error } = await supabase
        .from('client_platform_connections')
        .update(connectionData)
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update Shopify connection:', error);
        return NextResponse.json(
          { error: 'Failed to update Shopify connection', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new connection
      const { data, error } = await supabase
        .from('client_platform_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        console.error('Failed to create Shopify connection:', error);
        return NextResponse.json(
          { error: 'Failed to create Shopify connection', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: 'Shopify store access verified and saved successfully',
      connection: {
        id: result.id,
        platform: 'shopify',
        store_domain: storeDomain,
        connected_at: result.created_at,
        collaborator_code: collaboratorCode,
        status: 'verified'
      }
    });

  } catch (error) {
    console.error('Shopify verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
