import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get real client ID from authentication/session
    // For now, using a mock client ID - replace with real auth
    const mockClientId = '00000000-0000-0000-0000-000000000001';

    console.log('[Client Connections API] Fetching connections for client:', mockClientId);

    const supabase = getSupabaseAdmin();

    // Fetch platform connections for this client
    const { data: connections, error: connectionsError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', mockClientId)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('[Client Connections API] Error fetching connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    console.log('[Client Connections API] Found connections:', connections?.length || 0);
    
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
