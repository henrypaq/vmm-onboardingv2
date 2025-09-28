import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest, updateOnboardingLink, getOnboardingLinkByToken, getClientByEmail, createClient, updateClient, upsertClientPlatformConnection, getOnboardingRequestByLinkId } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token, permissions, data, testMode } = await request.json();
    
    if (!token || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Token and permissions are required' },
        { status: 400 }
      );
    }

    // Validate the link
    const link = await getOnboardingLinkByToken(token);
    
    if (!link) {
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }

    // Note: Links can be used multiple times, so we don't check if already completed

    // Handle client creation/update
    let clientId: string | undefined;
    if (data?.email) {
      // Check if client already exists for this admin
      const existingClient = await getClientByEmail(link.admin_id, data.email);
      
      if (existingClient) {
        // Update existing client
        const updatedClient = await updateClient(existingClient.id, {
          full_name: data.name || existingClient.full_name,
          company_name: data.company || existingClient.company_name,
          last_onboarding_at: new Date().toISOString(),
          status: 'active'
        });
        clientId = updatedClient.id;
        console.log(`Updated existing client: ${updatedClient.id}`);
      } else {
        // Create new client
        const newClient = await createClient({
          admin_id: link.admin_id,
          email: data.email,
          full_name: data.name,
          company_name: data.company,
          status: 'active',
          last_onboarding_at: new Date().toISOString()
        });
        clientId = newClient.id;
        console.log(`Created new client: ${newClient.id}`);
      }
    }

    // Get existing onboarding request with stored OAuth data
    const existingRequest = await getOnboardingRequestByLinkId(link.id);
    const storedPlatformConnections = existingRequest?.platform_connections || {};

    // Create the onboarding request
    const onboardingRequest = await createOnboardingRequest({
      link_id: link.id,
      client_id: clientId,
      client_email: data?.email,
      client_name: data?.name,
      company_name: data?.company,
      granted_permissions: permissions.reduce((acc: Record<string, string[]>, perm: string) => {
        const [platform, scope] = perm.split(':');
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(scope);
        return acc;
      }, {}),
      platform_connections: storedPlatformConnections,
      status: 'completed', // Mark as completed since client has granted access
    });

    // Save platform connections to client_platform_connections table
    if (clientId) {
      console.log(`[Onboarding] Saving platform connections for client ${clientId}`);
      
      if (testMode) {
        // Test mode: create placeholder connections for all requested platforms
        console.log(`[Onboarding] Test mode: creating placeholder connections`);
        
        for (const platform of link.platforms) {
          try {
            await upsertClientPlatformConnection({
              client_id: clientId,
              platform: platform as 'meta' | 'google' | 'tiktok' | 'shopify',
              platform_user_id: `test_user_${platform}_${Date.now()}`,
              platform_username: `Test User (${platform})`,
              access_token: `test_token_${platform}_${Date.now()}`,
              refresh_token: `test_refresh_${platform}_${Date.now()}`,
              token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
              scopes: ['test_scope', 'dummy_scope'],
              is_active: false // Mark as inactive to indicate it's a test connection
            });
            console.log(`[Onboarding] Created test placeholder for ${platform} connection`);
          } catch (error) {
            console.error(`[Onboarding] Failed to create test placeholder for ${platform}:`, error);
          }
        }
      } else if (Object.keys(storedPlatformConnections).length > 0) {
        // Normal mode: save real OAuth connections
        for (const [platform, connectionData] of Object.entries(storedPlatformConnections)) {
          try {
            await upsertClientPlatformConnection({
              client_id: clientId,
              platform: platform as 'meta' | 'google' | 'tiktok' | 'shopify',
              platform_user_id: connectionData.platform_user_id || '',
              platform_username: connectionData.platform_username,
              access_token: connectionData.access_token,
              refresh_token: connectionData.refresh_token,
              token_expires_at: connectionData.token_expires_at,
              scopes: Array.isArray(connectionData.scopes) ? connectionData.scopes : [],
              is_active: true
            });
            console.log(`[Onboarding] Saved ${platform} connection for client ${clientId}`);
          } catch (error) {
            console.error(`[Onboarding] Failed to save ${platform} connection:`, error);
          }
        }
      } else {
        console.log(`[Onboarding] No OAuth connections found, skipping platform connection creation`);
      }
    }

    // Mark the link as used (but keep it usable for future clients)
    await updateOnboardingLink(link.id, {
      is_used: true, // Track that this link has been used
      // Don't set status to completed - keep it usable
      // Don't set client_id - multiple clients can use the same link
    });

    console.log(`[Onboarding] Completed for token ${token}`);

    return NextResponse.json({
      success: true,
      requestId: onboardingRequest.id,
    });
  } catch (error) {
    console.error('Onboarding submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit onboarding request' },
      { status: 500 }
    );
  }
}
