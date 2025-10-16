import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { fetchPlatformAssets } from '@/lib/oauth/oauth-utils';

export async function GET(request: NextRequest) {
  console.log('=== PLATFORM ASSETS API START ===');
  
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const clientId = searchParams.get('clientId');

    console.log('Assets API request:', { platform, clientId });

    if (!platform || !clientId) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: platform, clientId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    console.log('Supabase admin client created');

    // Get the platform connection for this client
    console.log('Looking for platform connection:', { clientId, platform });
    
    // First try to find it as an onboarding request
    const { data: onboardingRequest, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .select('id, client_id, client_email, client_name, status')
      .eq('id', clientId)
      .single();

    console.log('Onboarding request lookup:', { 
      onboardingRequest, 
      onboardingError,
      errorCode: onboardingError?.code,
      errorMessage: onboardingError?.message
    });

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
        console.log('Neither onboarding request nor client found');
        return NextResponse.json(
          { error: 'Client or onboarding request not found' },
          { status: 404 }
        );
      }
      requestId = client.id;
      console.log('Found client:', requestId);
    }

    // Now look for platform connection using the correct ID
    console.log('Looking for platform connection with requestId:', { requestId, platform });
    
    // First try to find connection using the onboarding request ID
    let { data: connection, error: connectionError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', requestId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    console.log('First attempt - connection lookup:', { connection, connectionError });

    // If not found and this is an onboarding request, try to find the actual client ID
    if (connectionError && onboardingRequest) {
      console.log('🔍 [ASSETS API] Connection not found with onboarding request ID, trying to find actual client...');
      console.log('🔍 [ASSETS API] Onboarding request client_id:', onboardingRequest.client_id);
      
      // Get the actual client ID from the onboarding request
      const actualClientId = onboardingRequest.client_id;
      console.log('🔍 [ASSETS API] Actual client ID from onboarding request:', actualClientId);
      
      if (actualClientId) {
        // Try to find connection using the actual client ID
        const { data: actualConnection, error: actualError } = await supabase
          .from('client_platform_connections')
          .select('*')
          .eq('client_id', actualClientId)
          .eq('platform', platform)
          .eq('is_active', true)
          .single();

        console.log('🔍 [ASSETS API] Second attempt - actual client connection lookup:', { actualConnection, actualError });
        
        if (actualConnection && !actualError) {
          connection = actualConnection;
          connectionError = null;
          console.log('🔍 [ASSETS API] Found connection using actual client ID!');
        }
      } else {
        console.log('🔍 [ASSETS API] No actual client ID found in onboarding request');
        
        // Try to find any connection for this platform by searching all connections
        console.log('🔍 [ASSETS API] Searching all platform connections for platform:', platform);
        const { data: allConnections, error: allError } = await supabase
          .from('client_platform_connections')
          .select('*')
          .eq('platform', platform)
          .eq('is_active', true)
          .limit(10);
        
        console.log('🔍 [ASSETS API] All connections for platform:', { allConnections, allError });
        
        if (allConnections && allConnections.length > 0) {
          // Use the most recent connection
          connection = allConnections[0];
          connectionError = null;
          console.log('🔍 [ASSETS API] Using most recent connection:', connection);
        }
      }
    }

    console.log('Connection query result:', { connection, connectionError });

    if (connectionError || !connection) {
      console.log('Platform connection not found:', connectionError);
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    console.log('Found platform connection:', {
      id: connection.id,
      platform: connection.platform,
      platform_user_id: connection.platform_user_id,
      has_access_token: !!connection.access_token
    });

    // Fetch assets based on platform
    let assets = [];
    
    switch (platform) {
      case 'meta':
        console.log('🔍 [PLATFORM ASSETS] Fetching Meta assets using oauth-utils...');
        try {
          // Get the scopes from the platform connection
          const scopes = connection.scopes || [];
          console.log('🔍 [PLATFORM ASSETS] Meta scopes:', scopes);
          
          // Use the working fetchPlatformAssets function from oauth-utils
          assets = await fetchPlatformAssets('meta', connection.access_token, scopes);
          console.log('🔍 [PLATFORM ASSETS] Meta assets from oauth-utils:', assets);
        } catch (error) {
          console.error('🔍 [PLATFORM ASSETS] Error fetching Meta assets:', error);
          assets = [];
        }
        break;
      case 'google':
        console.log('🔍 [PLATFORM ASSETS] Using stored Google assets from platform connection...');
        
        // Check if we have stored assets in the platform connection
        if (connection.assets && connection.assets.length > 0) {
          console.log('🔍 [PLATFORM ASSETS] Found stored Google assets:', connection.assets.length);
          assets = connection.assets;
          console.log('🔍 [PLATFORM ASSETS] Using stored assets:', assets);
        } else {
          console.log('🔍 [PLATFORM ASSETS] No stored assets found, fetching fresh from Google APIs...');
          try {
            // Get the scopes from the platform connection
            const scopes = connection.scopes || [];
            console.log('🔍 [PLATFORM ASSETS] Google scopes:', scopes);
            
            // Use the working fetchPlatformAssets function from oauth-utils
            assets = await fetchPlatformAssets('google', connection.access_token, scopes);
            console.log('🔍 [PLATFORM ASSETS] Google assets from oauth-utils:', assets);
          } catch (error) {
            console.error('🔍 [PLATFORM ASSETS] Error fetching Google assets:', error);
            assets = [];
          }
        }
        break;
      default:
        console.log('Unsupported platform:', platform);
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    console.log('=== PLATFORM ASSETS API SUCCESS ===');
    console.log('Returning assets:', assets);

    return NextResponse.json({ assets });

  } catch (error) {
    console.error('=== PLATFORM ASSETS API ERROR ===');
    console.error('Error fetching platform assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: error.message },
      { status: 500 }
    );
  }
}

