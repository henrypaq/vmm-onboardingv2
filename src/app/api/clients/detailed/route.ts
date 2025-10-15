import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Temporary: Use a default admin ID for testing
    const adminId = '00000000-0000-0000-0000-000000000001';
    console.log(`[Detailed Clients API] Fetching detailed clients for admin: ${adminId}`);
    
    // Get clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('[Detailed Clients API] Error fetching clients:', clientsError);
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // Get onboarding links for this admin
    const { data: links, error: linksError } = await supabaseAdmin
      .from('onboarding_links')
      .select('*')
      .eq('admin_id', adminId);

    if (linksError) {
      console.error('[Detailed Clients API] Error fetching links:', linksError);
      throw new Error(`Failed to fetch links: ${linksError.message}`);
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
      // Find onboarding request for this client
      const request = requests?.find(r => r.client_id === client.id);
      
      // Find link for this request
      const link = request ? links?.find(l => l.id === request.link_id) : null;
      
      // Find platform connections for this client
      const clientConnections = connections?.filter(c => c.client_id === client.id) || [];
      
      // Determine status based on platform connections
      const hasConnections = clientConnections.length > 0;
      const status = hasConnections ? 'active' : 'pending';
      
      // Get platforms from connections
      const platforms = clientConnections.map(c => c.platform);

      return {
        ...client,
        linkId: link?.id || null,
        linkName: link?.link_name || null,
        linkUrl: link ? `https://onboarding.callisto.ai/join/${link.token}` : null,
        platforms: platforms,
        status: status,
        connectedDate: request?.submitted_at || client.created_at,
        onboardingRequest: request
      };
    }) || [];

    console.log(`[Detailed Clients API] Found ${detailedClients.length} detailed clients`);
    
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
