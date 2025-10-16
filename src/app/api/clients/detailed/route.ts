import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    console.log(`[Detailed Clients API] Fetching detailed clients (shared across all admins)`);
    
    // Get clients (shared across all admins)
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('[Detailed Clients API] Error fetching clients:', clientsError);
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // Get onboarding links (shared across all admins)
    const { data: links, error: linksError } = await supabaseAdmin
      .from('onboarding_links')
      .select('*');

    if (linksError) {
      console.error('[Detailed Clients API] Error fetching links:', linksError);
      throw new Error(`Failed to fetch links: ${linksError.message}`);
    }

    console.log(`[Detailed Clients API] Found ${links?.length || 0} onboarding links`);
    if (links && links.length > 0) {
      console.log('[Detailed Clients API] Available links:', links.map(l => ({ id: l.id, token: l.token, link_name: l.link_name })));
    }

    // Get onboarding requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('onboarding_requests')
      .select('*')
      .in('link_id', links?.map(l => l.id) || []);

    if (requestsError) {
      console.error('[Detailed Clients API] Error fetching requests:', requestsError);
      throw new Error(`Failed to fetch requests: ${requestsError.message}`);
    }

    console.log(`[Detailed Clients API] Found ${clients?.length || 0} clients`);
    console.log(`[Detailed Clients API] Found ${links?.length || 0} onboarding links`);
    console.log(`[Detailed Clients API] Found ${requests?.length || 0} onboarding requests`);
    
    // Debug: Log all links and requests for troubleshooting
    if (links && links.length > 0) {
      console.log('[Detailed Clients API] All available links:', links.map(l => ({ 
        id: l.id, 
        token: l.token, 
        link_name: l.link_name,
        admin_id: l.admin_id 
      })));
    }
    
    if (requests && requests.length > 0) {
      console.log('[Detailed Clients API] All available requests:', requests.map(r => ({ 
        id: r.id, 
        client_id: r.client_id, 
        link_id: r.link_id,
        submitted_at: r.submitted_at 
      })));
    }
    
    // Get client platform connections
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('client_platform_connections')
      .select('*')
      .in('client_id', clients?.map(c => c.id) || [])
      .eq('is_active', true);

    if (connectionsError) {
      console.error('[Detailed Clients API] Error fetching connections:', connectionsError);
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
    }

    // Combine the data
    const detailedClients = clients?.map(client => {
      // Find onboarding request for this client - try both string and UUID matching
      const request = requests?.find(r => 
        r.client_id === client.id || 
        r.client_id === client.id.toString() ||
        r.client_id?.toString() === client.id?.toString()
      );
      
      // Find link for this request - try both string and UUID matching
      const link = request ? links?.find(l => 
        l.id === request.link_id || 
        l.id === request.link_id?.toString() ||
        l.id?.toString() === request.link_id?.toString()
      ) : null;
      
      // Debug logging for missing links
      console.log(`[Detailed Clients API] Client ${client.id} (${client.full_name}) - Request:`, request ? 'Found' : 'Not found');
      console.log(`[Detailed Clients API] Client ID type: ${typeof client.id}, value: ${client.id}`);
      if (request) {
        console.log(`[Detailed Clients API] Request client_id type: ${typeof request.client_id}, value: ${request.client_id}`);
        console.log(`[Detailed Clients API] Request link_id type: ${typeof request.link_id}, value: ${request.link_id}`);
        console.log(`[Detailed Clients API] Link found:`, link ? 'Yes' : 'No');
        if (link) {
          console.log(`[Detailed Clients API] Link ID type: ${typeof link.id}, value: ${link.id}`);
        }
      }
      
      if (!link && request) {
        console.log(`[Detailed Clients API] Client ${client.id} has request but no link found. Request link_id: ${request.link_id}`);
        console.log(`[Detailed Clients API] Available links:`, links?.map(l => ({ id: l.id, token: l.token, link_name: l.link_name })));
      } else if (!request) {
        console.log(`[Detailed Clients API] Client ${client.id} has no onboarding request`);
      } else if (link) {
        const constructedUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${link.token}`;
        console.log(`[Detailed Clients API] Client ${client.id} link constructed:`, constructedUrl);
      }
      
      // Find platform connections for this client
      const clientConnections = connections?.filter(c => c.client_id === client.id) || [];
      
      // Determine status based on platform connections
      const hasConnections = clientConnections.length > 0;
      const status = hasConnections ? 'active' : 'pending';
      
      // Get platforms from connections
      const platforms = clientConnections.map(c => c.platform);

      const constructedUrl = link ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${link.token}` : null;
      console.log(`[Detailed Clients API] Client ${client.id} final linkUrl:`, constructedUrl);
      
      return {
        ...client,
        linkId: link?.id || null,
        linkName: link?.link_name || null,
        linkUrl: constructedUrl,
        platforms: platforms,
        status: status,
        connectedDate: request?.submitted_at || client.created_at,
        onboardingRequest: request
      };
    }) || [];

    console.log(`[Detailed Clients API] Found ${detailedClients.length} detailed clients`);
    
    // Debug: Log final client data with linkUrls
    detailedClients.forEach((client, index) => {
      console.log(`[Detailed Clients API] Final client ${index + 1}:`, {
        id: client.id,
        name: client.full_name,
        linkUrl: client.linkUrl,
        hasRequest: !!client.onboardingRequest,
        requestLinkId: client.onboardingRequest?.link_id
      });
    });
    
    return NextResponse.json({ clients: detailedClients });
  } catch (error) {
    console.error('[Detailed Clients API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch detailed clients',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
