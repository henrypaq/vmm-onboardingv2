import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest, updateOnboardingRequest, updateOnboardingLink, getOnboardingLinkByToken, getClientByEmail, createClient as createClientRecord, updateClient, upsertClientPlatformConnection, getOnboardingRequestByLinkId, ensureUserExists, getClientPlatformConnection, updateClientPlatformConnection } from '@/lib/db/database';
import { discoverGoogleAssets } from '@/lib/oauth/oauth-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Accept both payload shapes:
    // - { token, permissions: string[], data: { name, email, company }, testMode }
    // - { token, client_name, client_email, company_name, requested_permissions }
    const rawBody = await request.json();
    const token: string | undefined = rawBody.token;
    const testMode: boolean = Boolean(rawBody.testMode);
    // Handle both payload formats:
    // Format 1: { token, data: { name, email, company } }
    // Format 2: { token, client_name, client_email, company_name }
    let data: { name?: string; email?: string; company?: string };
    
    if (rawBody.data && typeof rawBody.data === 'object') {
      // Format 1: data object exists
      data = {
        name: rawBody.data.name,
        email: rawBody.data.email,
        company: rawBody.data.company
      };
    } else {
      // Format 2: flat structure
      data = {
        name: rawBody.client_name,
        email: rawBody.client_email,
        company: rawBody.company_name
      };
    }
    
    // Trim whitespace from all fields
    if (data.name) data.name = data.name.trim();
    if (data.email) data.email = data.email.trim();
    if (data.company) data.company = data.company.trim();
    let permissions: string[] | undefined = Array.isArray(rawBody.permissions)
      ? rawBody.permissions as string[]
      : undefined;
    
    console.log('[Onboarding] ===========================================');
    console.log('[Onboarding] 🚀 SUBMIT REQUEST RECEIVED 🚀');
    console.log('[Onboarding] ===========================================');
    console.log('[Onboarding] Token:', token);
    console.log('[Onboarding] Test Mode:', testMode);
    console.log('[Onboarding] Data:', data);
    console.log('[Onboarding] Full request body:', { token, permissions, data, testMode });
    console.log('[Onboarding] Raw request body:', rawBody);
    console.log('[Onboarding] Data validation:', {
      hasEmail: !!data?.email,
      hasName: !!data?.name,
      hasCompany: !!data?.company,
      emailValue: data?.email,
      nameValue: data?.name,
      companyValue: data?.company
    });
    console.log('[Onboarding] Data object type:', typeof data);
    console.log('[Onboarding] Data object keys:', data ? Object.keys(data) : 'null');
    console.log('[Onboarding] ===========================================');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the link
    console.log('[Onboarding] ===========================================');
    console.log('[Onboarding] 🔍 VALIDATING ONBOARDING LINK');
    console.log('[Onboarding] ===========================================');
    const link = await getOnboardingLinkByToken(token);
    
    if (!link) {
      console.error('[Onboarding] ❌ Invalid link - token not found:', token);
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }
    
    console.log('[Onboarding] ✅ Link validated:', {
      linkId: link.id,
      adminId: link.admin_id,
      platforms: link.platforms,
      linkName: link.link_name
    });
    console.log('[Onboarding] ===========================================');

    // Note: Links can be used multiple times, so we don't check if already completed

    // If no permissions provided, synthesize from link platforms so flow can complete
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      // Use requested_permissions if present, else platform-level basic scope
      try {
        const requested = link.requested_permissions as Record<string, string[]> | null | undefined;
        if (requested && typeof requested === 'object') {
          const synthesized: string[] = [];
          for (const [platform, scopes] of Object.entries(requested)) {
            if (Array.isArray(scopes) && scopes.length > 0) {
              for (const s of scopes) synthesized.push(`${platform}:${s}`);
            } else {
              synthesized.push(`${platform}:basic`);
            }
          }
          permissions = synthesized;
        } else if (Array.isArray(link.platforms) && link.platforms.length > 0) {
          permissions = link.platforms.map((p) => `${p}:basic`);
        } else {
          permissions = [];
        }
      } catch {
        permissions = [];
      }
    }

    // Handle client creation/update - ONLY when flow is completed
    let clientId: string | undefined;
    if (data?.email) {
      console.log(`[Onboarding] Will create/update client with email ${data.email} after onboarding request is created`);
      console.log(`[Onboarding] Client data:`, { name: data.name, email: data.email, company: data.company });
      console.log(`[Onboarding] Link admin_id:`, link.admin_id, 'Type:', typeof link.admin_id);
    } else {
      console.log(`[Onboarding] No email provided, skipping client creation`);
    }

    // Get existing onboarding request with stored OAuth data
    let existingRequest = null;
    let storedPlatformConnections = {};
    
    try {
      existingRequest = await getOnboardingRequestByLinkId(link.id);
      storedPlatformConnections = existingRequest?.platform_connections || {};
      console.log(`[Onboarding] Existing request found:`, existingRequest);
    } catch (error) {
      console.log(`[Onboarding] No existing request found (this is normal for new submissions):`, error);
      // This is normal for new submissions, continue with empty connections
    }

    // Prepare granted permissions from synthesized input
    let grantedPermissions = {};
    try {
      grantedPermissions = permissions.reduce((acc: Record<string, string[]>, perm: string) => {
        const [platform, scope] = perm.split(':');
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(scope);
        return acc;
      }, {});
      console.log(`[Onboarding] Processed granted permissions:`, grantedPermissions);
    } catch (error) {
      console.error(`[Onboarding] Error processing permissions:`, error);
      grantedPermissions = { meta: ['basic'] }; // Fallback
    }
    
    const onboardingRequestData = {
      link_id: link.id,
      client_id: clientId,
      client_email: data?.email,
      client_name: data?.name,
      company_name: data?.company,
      granted_permissions: grantedPermissions,
      platform_connections: storedPlatformConnections,
      status: 'completed' as const,
    };
    
    console.log(`[Onboarding] Link ID:`, link.id, 'Type:', typeof link.id);
    console.log(`[Onboarding] Link object:`, link);
    
    // Validate link.id
    if (!link.id) {
      throw new Error('Link ID is missing or invalid');
    }
    
    console.log(`[Onboarding] Creating onboarding request with data:`, onboardingRequestData);
    console.log(`[Onboarding] Client data being saved:`, {
      client_id: clientId,
      client_email: data?.email,
      client_name: data?.name,
      company_name: data?.company
    });
    
    // CRITICAL: Ensure user exists before creating onboarding request to avoid foreign key constraint errors
    let userId: string | null = null;
    if (data?.email) {
      console.log('[Onboarding] ===========================================');
      console.log('[Onboarding] ENSURING USER EXISTS BEFORE CREATING ONBOARDING REQUEST');
      console.log('[Onboarding] ===========================================');
      
      try {
        userId = await ensureUserExists({
          client_id: clientId,
          client_email: data.email,
          client_name: data.name,
          company_name: data.company
        });
        console.log('[Onboarding] User existence check completed. User ID:', userId);
      } catch (userError) {
        console.error('[Onboarding] Failed to ensure user exists:', userError);
        console.error('[Onboarding] Continuing without userId to avoid blocking the flow');
        userId = null; // Explicitly set to null to avoid undefined issues
      }
    }
    
    // Update existing in_progress request if present, else create
    let onboardingRequest;
    try {
      const existing = await getOnboardingRequestByLinkId(link.id);
      if (existing) {
        console.log('[Onboarding] Found existing onboarding request:', existing.id);
        
        // For existing requests, use the userId we just ensured exists
        const updateData = { ...onboardingRequestData };
        if (userId) {
          updateData.client_id = userId;
          console.log('[Onboarding] Using userId for existing request:', userId);
        } else {
          console.log('[Onboarding] No userId available, setting client_id to null to avoid foreign key issues');
          updateData.client_id = null; // Use null instead of undefined
        }
        
        console.log('[Onboarding] Updating existing request with data:', updateData);
        onboardingRequest = await updateOnboardingRequest(existing.id, updateData);
        console.log('[Onboarding] Successfully updated existing onboarding request to completed');
      } else {
        console.log('[Onboarding] No existing request found, creating new one');
        
        // For new requests, use the userId we just ensured exists
        const createData = { ...onboardingRequestData };
        if (userId) {
          createData.client_id = userId;
          console.log('[Onboarding] Using userId for new request:', userId);
        } else {
          console.log('[Onboarding] No userId available, setting client_id to null to avoid foreign key issues');
          createData.client_id = null; // Use null instead of undefined
        }
        
        console.log('[Onboarding] Creating new request with data:', createData);
        onboardingRequest = await createOnboardingRequest(createData);
        console.log('[Onboarding] Successfully created new onboarding request as completed');
      }
    } catch (onboardingError) {
      console.error('[Onboarding] ===========================================');
      console.error('[Onboarding] FAILED TO UPSERT ONBOARDING REQUEST');
      console.error('[Onboarding] Error:', onboardingError);
      console.error('[Onboarding] Error message:', onboardingError instanceof Error ? onboardingError.message : 'Unknown error');
      console.error('[Onboarding] Error stack:', onboardingError instanceof Error ? onboardingError.stack : 'No stack trace');
      console.error('[Onboarding] ===========================================');
      
      // Try a fallback approach - create a minimal onboarding request without client_id
      console.log('[Onboarding] ===========================================');
      console.log('[Onboarding] ATTEMPTING FALLBACK ONBOARDING REQUEST CREATION');
      console.log('[Onboarding] ===========================================');
      
      try {
        const fallbackData = {
          link_id: link.id,
          client_id: null, // Explicitly null to avoid foreign key issues
          client_email: data?.email,
          client_name: data?.name,
          company_name: data?.company,
          granted_permissions: grantedPermissions,
          platform_connections: storedPlatformConnections,
          status: 'completed' as const,
        };
        
        console.log('[Onboarding] Creating fallback onboarding request with data:', fallbackData);
        onboardingRequest = await createOnboardingRequest(fallbackData);
        console.log('[Onboarding] Fallback onboarding request created successfully');
      } catch (fallbackError) {
        console.error('[Onboarding] ===========================================');
        console.error('[Onboarding] FALLBACK ALSO FAILED');
        console.error('[Onboarding] Fallback error:', fallbackError);
        console.error('[Onboarding] ===========================================');
        throw onboardingError; // Throw the original error
      }
    }

    // DEFERRED: We save client_platform_connections AFTER we create/update the client below

    // Mark the link as used (but keep it usable for future clients)
    try {
      console.log(`[Onboarding] Updating link ${link.id} to mark as used`);
      await updateOnboardingLink(link.id, {
        is_used: true, // Track that this link has been used
        // Don't set status to completed - keep it usable
        // Don't set client_id - multiple clients can use the same link
      });
      console.log(`[Onboarding] Successfully marked link ${link.id} as used`);
    } catch (updateError) {
      console.error(`[Onboarding] Failed to update link ${link.id}:`, updateError);
      console.error(`[Onboarding] Link update error details:`, {
        message: updateError instanceof Error ? updateError.message : 'Unknown error',
        stack: updateError instanceof Error ? updateError.stack : undefined
      });
      // Continue anyway - the main submission is more important
    }

    // NOW create/update client since onboarding request was successful
    // CRITICAL: Client must be created before we can persist platform connections
    // Validate email and name are not just truthy, but actual non-empty strings
    const hasValidEmail = data?.email && typeof data.email === 'string' && data.email.trim().length > 0;
    const hasValidName = data?.name && typeof data.name === 'string' && data.name.trim().length > 0;
    
    console.log(`[Onboarding] ===========================================`);
    console.log(`[Onboarding] CLIENT CREATION VALIDATION`);
    console.log(`[Onboarding] ===========================================`);
    console.log(`[Onboarding] Data object:`, data);
    console.log(`[Onboarding] Email value:`, data?.email);
    console.log(`[Onboarding] Name value:`, data?.name);
    console.log(`[Onboarding] Company value:`, data?.company);
    console.log(`[Onboarding] Has valid email:`, hasValidEmail);
    console.log(`[Onboarding] Has valid name:`, hasValidName);
    console.log(`[Onboarding] Email type:`, typeof data?.email);
    console.log(`[Onboarding] Name type:`, typeof data?.name);
    console.log(`[Onboarding] ===========================================`);
    
    if (hasValidEmail && hasValidName) {
      console.log(`[Onboarding] ===========================================`);
      console.log(`[Onboarding] CREATING/UPDATING CLIENT`);
      console.log(`[Onboarding] ===========================================`);
      console.log(`[Onboarding] Email: ${data.email}`);
      console.log(`[Onboarding] Name: ${data.name}`);
      console.log(`[Onboarding] Company: ${data.company}`);
      
      // Use admin_id if available, otherwise use a default for the flow
      const adminId = link.admin_id || '00000000-0000-0000-0000-000000000000';
      console.log(`[Onboarding] Using admin_id:`, adminId);
      
      if (!adminId || adminId === '00000000-0000-0000-0000-000000000000') {
        console.error(`[Onboarding] ===========================================`);
        console.error(`[Onboarding] ERROR: Invalid admin_id!`);
        console.error(`[Onboarding] Link admin_id: ${link.admin_id}`);
        console.error(`[Onboarding] ===========================================`);
        return NextResponse.json(
          { error: 'Invalid admin ID. Cannot create client without valid admin.' },
          { status: 400 }
        );
      }
      
      try {
        // Check if client already exists for this admin
        const existingClient = await getClientByEmail(adminId, data.email);
      
        if (existingClient) {
          // Update existing client
          console.log(`[Onboarding] Found existing client: ${existingClient.id}`);
          const updatedClient = await updateClient(existingClient.id, {
            full_name: data.name || existingClient.full_name,
            company_name: data.company || existingClient.company_name,
            last_onboarding_at: new Date().toISOString(),
            status: 'active'
          });
          clientId = updatedClient.id;
          console.log(`[Onboarding] ✅ Updated existing client: ${updatedClient.id}`, updatedClient);
        } else {
          // Create new client
          console.log(`[Onboarding] Creating new client for admin ${adminId}`);
          const clientData = {
            admin_id: adminId,
            email: data.email,
            full_name: data.name,
            company_name: data.company,
            status: 'active' as const,
            last_onboarding_at: new Date().toISOString()
          };
          console.log(`[Onboarding] Client data to insert:`, clientData);
          const newClient = await createClientRecord(clientData);
          clientId = newClient.id;
          console.log(`[Onboarding] ✅ Created new client: ${newClient.id} for admin ${adminId}`, newClient);
        }
        
        console.log(`[Onboarding] ===========================================`);
        console.log(`[Onboarding] CLIENT CREATION SUCCESSFUL`);
        console.log(`[Onboarding] Client ID: ${clientId}`);
        console.log(`[Onboarding] ===========================================`);
      } catch (clientError) {
        console.error(`[Onboarding] ===========================================`);
        console.error(`[Onboarding] ❌ FAILED TO CREATE/UPDATE CLIENT`);
        console.error(`[Onboarding] ===========================================`);
        console.error(`[Onboarding] Error:`, clientError);
        console.error(`[Onboarding] Error message:`, clientError instanceof Error ? clientError.message : 'Unknown error');
        console.error(`[Onboarding] Error stack:`, clientError instanceof Error ? clientError.stack : undefined);
        console.error(`[Onboarding] Admin ID:`, adminId);
        console.error(`[Onboarding] Email:`, data.email);
        console.error(`[Onboarding] Name:`, data.name);
        console.error(`[Onboarding] Company:`, data.company);
        console.error(`[Onboarding] ===========================================`);
        
        // CRITICAL: Don't continue if client creation fails - return error
        return NextResponse.json(
          { 
            error: 'Failed to create/update client',
            details: clientError instanceof Error ? clientError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else {
      console.error(`[Onboarding] ===========================================`);
      console.error(`[Onboarding] ❌ CLIENT CREATION SKIPPED - INVALID DATA`);
      console.error(`[Onboarding] ===========================================`);
      console.error(`[Onboarding] Email provided:`, !!data?.email);
      console.error(`[Onboarding] Email value:`, data?.email);
      console.error(`[Onboarding] Email valid:`, hasValidEmail);
      console.error(`[Onboarding] Name provided:`, !!data?.name);
      console.error(`[Onboarding] Name value:`, data?.name);
      console.error(`[Onboarding] Name valid:`, hasValidName);
      console.error(`[Onboarding] Full data object:`, data);
      console.error(`[Onboarding] ===========================================`);
      
      // Don't return error - allow onboarding request to be marked as completed
      // But log that client wasn't created
      console.warn(`[Onboarding] ⚠️ WARNING: Client not created due to missing/invalid email or name`);
      console.warn(`[Onboarding] Onboarding request will be marked as completed, but no client record exists`);
    }

    // After we have clientId, persist permanent platform connections
    if (clientId) {
      try {
        const connections = storedPlatformConnections || {};
        console.log(`[Onboarding Submit] ===========================================`);
        console.log(`[Onboarding Submit] STARTING PLATFORM CONNECTION PROCESSING`);
        console.log(`[Onboarding Submit] Client ID: ${clientId}`);
        console.log(`[Onboarding Submit] Client ID type: ${typeof clientId}`);
        console.log(`[Onboarding Submit] Stored platform connections:`, connections);
        console.log(`[Onboarding Submit] Connections object keys:`, Object.keys(connections));
        console.log(`[Onboarding Submit] Connections count:`, Object.keys(connections).length);
        
        if (Object.keys(connections).length > 0) {
          console.log(`[Onboarding Submit] Processing ${Object.keys(connections).length} platform connection(s)...`);
          
          for (const [platform, connectionData] of Object.entries<any>(connections)) {
            console.log(`[Onboarding Submit] ===========================================`);
            console.log(`[Onboarding Submit] PROCESSING PLATFORM: ${platform.toUpperCase()}`);
            console.log(`[Onboarding Submit] Connection data:`, {
              platform_user_id: connectionData.platform_user_id,
              platform_username: connectionData.platform_username,
              has_access_token: !!connectionData.access_token,
              access_token_preview: connectionData.access_token ? connectionData.access_token.substring(0, 20) + '...' : 'none',
              assets_count: connectionData.assets?.length || 0,
              scopes_count: connectionData.scopes?.length || 0
            });
            
            let finalAssets = connectionData.assets || [];
            
            // For Google connections, trigger fresh asset discovery to get the latest assets
            if (platform === 'google' && connectionData.access_token) {
              console.log(`[Onboarding Submit] ===========================================`);
              console.log(`[Onboarding Submit] 🚀 TRIGGERING FRESH GOOGLE ASSET DISCOVERY! 🚀`);
              console.log(`[Onboarding Submit] Client ID: ${clientId}`);
              console.log(`[Onboarding Submit] Access token preview: ${connectionData.access_token.substring(0, 20)}...`);
              console.log(`[Onboarding Submit] ===========================================`);
              
              try {
                const discoveredAssets = await discoverGoogleAssets(connectionData.access_token, clientId);
                console.log(`[Onboarding Submit] ===========================================`);
                console.log(`[Onboarding Submit] ✅ FRESH ASSET DISCOVERY COMPLETED! ✅`);
                console.log(`[Onboarding Submit] Discovered ${discoveredAssets.length} assets:`, discoveredAssets);
                console.log(`[Onboarding Submit] ===========================================`);
                finalAssets = discoveredAssets;
              } catch (error) {
                console.error(`[Onboarding Submit] ===========================================`);
                console.error(`[Onboarding Submit] ❌ FRESH ASSET DISCOVERY FAILED! ❌`);
                console.error(`[Onboarding Submit] Error:`, error);
                console.error(`[Onboarding Submit] Falling back to stored assets...`);
                console.error(`[Onboarding Submit] ===========================================`);
                // Fall back to stored assets if discovery fails
                finalAssets = connectionData.assets || [];
              }
            } else {
              console.log(`[Onboarding Submit] Skipping fresh asset discovery for ${platform} (not Google or no access token)`);
            }
            
            // FILTER ASSETS: If user selected specific assets, only use those
            // Check for selected_assets in the connection data (stored from asset selection UI)
            const selectedAssets = connectionData.selected_assets;
            if (selectedAssets && Array.isArray(selectedAssets) && selectedAssets.length > 0) {
              console.log(`[Onboarding Submit] ===========================================`);
              console.log(`[Onboarding Submit] 🎯 FILTERING ASSETS BY USER SELECTION`);
              console.log(`[Onboarding Submit] Selected assets (IDs):`, selectedAssets);
              console.log(`[Onboarding Submit] Total discovered assets before filtering:`, finalAssets.length);
              
              // Filter finalAssets to only include selected ones
              // selectedAssets is an array of asset IDs
              const filteredAssets = finalAssets.filter(asset => 
                selectedAssets.includes(asset.id) || selectedAssets.includes(asset.id?.toString())
              );
              
              console.log(`[Onboarding Submit] Assets after filtering:`, filteredAssets.length);
              console.log(`[Onboarding Submit] Filtered asset IDs:`, filteredAssets.map(a => a.id));
              console.log(`[Onboarding Submit] ===========================================`);
              
              finalAssets = filteredAssets;
            } else {
              console.log(`[Onboarding Submit] No asset selection found, using all discovered assets (${finalAssets.length} total)`);
            }
            
            // Check if connection already exists in client_platform_connections
            const existingConnection = await getClientPlatformConnection(clientId, platform);
            
            if (existingConnection) {
              console.log(`[Onboarding Submit] Connection already exists in client_platform_connections, checking if assets need updating...`);
              
              // Only update if assets have changed
              const assetsChanged = JSON.stringify(finalAssets) !== JSON.stringify(existingConnection.assets || []);
              
              if (assetsChanged) {
                console.log(`[Onboarding Submit] Assets changed, updating existing connection...`);
                await updateClientPlatformConnection(existingConnection.id, {
                  assets: finalAssets
                });
              } else {
                console.log(`[Onboarding Submit] No asset changes, skipping update of existing connection`);
              }
            } else {
              console.log(`[Onboarding Submit] No existing connection found, creating new one...`);
              const connectionResult = await upsertClientPlatformConnection({
                client_id: clientId,
                platform: platform as 'meta' | 'google' | 'tiktok' | 'shopify',
                platform_user_id: connectionData.platform_user_id || '',
                platform_username: connectionData.platform_username,
                access_token: connectionData.access_token,
                refresh_token: connectionData.refresh_token,
                token_expires_at: connectionData.token_expires_at,
                scopes: Array.isArray(connectionData.scopes) ? connectionData.scopes : [],
                assets: finalAssets,
                is_active: true
              });
              
              console.log(`[Onboarding Submit] ✅ Created ${platform} connection for client ${clientId}`);
              console.log(`[Onboarding Submit] Connection result:`, {
                id: connectionResult.id,
                client_id: connectionResult.client_id,
                platform: connectionResult.platform,
                assets_count: connectionResult.assets?.length || 0
              });
            }
          }
          console.log(`[Onboarding] Persisted ${Object.keys(connections).length} platform connection(s) for client ${clientId}`);
        } else {
          console.log('[Onboarding] No stored platform connections to persist');
        }
      } catch (err) {
        console.error('[Onboarding] Failed to persist client_platform_connections:', err);
      }
    }

    // Link the onboarding request to the client record so admin details can load by client_id
    try {
      if (clientId && onboardingRequest?.id) {
        await updateOnboardingRequest(onboardingRequest.id, {
          client_id: clientId,
        } as any);
        console.log(`[Onboarding] Linked onboarding request ${onboardingRequest.id} to client ${clientId}`);
      }
    } catch (linkErr) {
      console.error('[Onboarding] Failed to backfill client_id on onboarding request:', linkErr);
      // Non-fatal
    }

    console.log('[Onboarding] ===========================================');
    console.log('[Onboarding] ✅ ONBOARDING SUBMISSION COMPLETE');
    console.log('[Onboarding] ===========================================');
    console.log('[Onboarding] Token:', token);
    console.log('[Onboarding] Client ID:', clientId);
    console.log('[Onboarding] Client Created:', !!clientId);
    console.log('[Onboarding] Onboarding Request ID:', onboardingRequest?.id);
    console.log('[Onboarding] Client Email:', data?.email);
    console.log('[Onboarding] Client Name:', data?.name);
    console.log('[Onboarding] Company:', data?.company);
    console.log('[Onboarding] Admin ID:', link.admin_id);
    console.log('[Onboarding] ===========================================');
    
    if (!clientId) {
      console.error('[Onboarding] ===========================================');
      console.error('[Onboarding] ⚠️ WARNING: NO CLIENT WAS CREATED');
      console.error('[Onboarding] ===========================================');
      console.error('[Onboarding] This means the client will not appear in the admin dashboard');
      console.error('[Onboarding] Email provided:', data?.email);
      console.error('[Onboarding] Name provided:', data?.name);
      console.error('[Onboarding] ===========================================');
    }

    return NextResponse.json({
      success: true,
      requestId: onboardingRequest?.id || 'unknown',
      clientId: clientId || null,
      message: clientId 
        ? 'Onboarding request submitted successfully and client created' 
        : 'Onboarding request submitted successfully, but client was not created',
      clientCreated: !!clientId,
      warning: !clientId ? 'Client was not created. Please check logs for details.' : undefined
    });
  } catch (error) {
    console.error('Onboarding submission error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to submit onboarding request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
