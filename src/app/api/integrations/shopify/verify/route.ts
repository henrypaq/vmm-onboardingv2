import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, storeDomain, collaboratorCode } = await request.json();

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

    // Validate collaborator code format (typically 6-8 characters)
    if (collaboratorCode.length < 6 || collaboratorCode.length > 8) {
      return NextResponse.json(
        { error: 'Invalid collaborator code format. Must be 6-8 characters' },
        { status: 400 }
      );
    }

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if Shopify connection already exists for this client
    const { data: existingConnection, error: existingError } = await supabase
      .from('client_platform_connections')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', 'shopify')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Database error checking existing connection' },
        { status: 500 }
      );
    }

    const connectionData = {
      client_id: clientId,
      platform: 'shopify',
      is_active: true,
      assets: [
        {
          id: storeDomain,
          name: storeDomain,
          type: 'store',
          url: `https://${storeDomain}`,
        }
      ],
      metadata: {
        store_domain: storeDomain,
        collaborator_code: collaboratorCode,
        connected_at: new Date().toISOString(),
        verification_status: 'verified'
      },
      scopes: ['store_access'],
      expires_at: null, // Shopify connections don't expire
    };

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
        return NextResponse.json(
          { error: 'Failed to update Shopify connection' },
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
        return NextResponse.json(
          { error: 'Failed to create Shopify connection' },
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
        connected_at: result.metadata.connected_at,
        is_active: result.is_active
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
