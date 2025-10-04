import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = createClient();
    const { clientId } = await params;

    console.log('[Client Connections API] ===========================================');
    console.log('[Client Connections API] Fetching connections for client:', clientId);
    console.log('[Client Connections API] Client ID type:', typeof clientId);

    // Fetch platform connections for this client
    const { data: connections, error: connectionsError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('[Client Connections API] Error fetching connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    console.log('[Client Connections API] Found connections:', connections?.length || 0);
    console.log('[Client Connections API] Raw connections data:', connections);
    
    // Debug: Log each connection's assets
    if (connections && connections.length > 0) {
      connections.forEach((conn, index) => {
        console.log(`[Client Connections API] Connection ${index + 1}:`, {
          id: conn.id,
          platform: conn.platform,
          platform_username: conn.platform_username,
          assets: conn.assets,
          assets_count: conn.assets?.length || 0
        });
      });
    }
    
    // Debug: Also try to fetch all connections to see what's in the table
    const { data: allConnections } = await supabase
      .from('client_platform_connections')
      .select('client_id, platform, platform_username, assets')
      .limit(10);
    console.log('[Client Connections API] Sample of all connections in table:', allConnections);
    console.log('[Client Connections API] ===========================================');

    return NextResponse.json({
      success: true,
      connections: connections || []
    });

  } catch (error) {
    console.error('[Client Connections API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
