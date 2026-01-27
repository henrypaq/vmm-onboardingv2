import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { clientId } = await params;

    console.log('[Client Connections API] ===========================================');
    console.log('[Client Connections API] Fetching connections for client:', clientId);
    console.log('[Client Connections API] Client ID type:', typeof clientId);

    // Fetch platform connections for this client
    // Try both exact match and string conversion to handle UUID type mismatches
    const { data: connections, error: connectionsError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    // If no connections found with exact match, try fetching all and filtering manually
    // This handles potential UUID type mismatches
    let finalConnections = connections || [];
    
    if (finalConnections.length === 0) {
      console.log('[Client Connections API] No connections found with exact match, trying broader query...');
      const { data: allConnections } = await supabase
        .from('client_platform_connections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (allConnections) {
        // Filter manually to handle UUID type mismatches
        finalConnections = allConnections.filter(conn => 
          conn.client_id === clientId ||
          conn.client_id?.toString() === clientId?.toString() ||
          String(conn.client_id) === String(clientId)
        );
        console.log('[Client Connections API] Found', finalConnections.length, 'connections after manual filtering');
      }
    }

    if (connectionsError) {
      console.error('[Client Connections API] Error fetching connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    console.log('[Client Connections API] Found connections:', finalConnections.length);
    console.log('[Client Connections API] Raw connections data:', finalConnections);
    
    // Debug: Log each connection's assets
    if (finalConnections && finalConnections.length > 0) {
      finalConnections.forEach((conn, index) => {
        console.log(`[Client Connections API] Connection ${index + 1}:`, {
          id: conn.id,
          client_id: conn.client_id,
          client_id_type: typeof conn.client_id,
          platform: conn.platform,
          platform_username: conn.platform_username,
          is_active: conn.is_active,
          assets: conn.assets,
          assets_count: conn.assets?.length || 0
        });
      });
    } else {
      console.log('[Client Connections API] ⚠️ No connections found for client:', clientId);
      
      // Debug: Check what connections exist in the table
      const { data: allConnections } = await supabase
        .from('client_platform_connections')
        .select('id, client_id, platform, is_active, created_at')
        .limit(20);
      console.log('[Client Connections API] Sample of all connections in table:', allConnections);
      console.log('[Client Connections API] Searching for client_id matching:', clientId);
      if (allConnections) {
        const matching = allConnections.filter(c => 
          String(c.client_id) === String(clientId)
        );
        console.log('[Client Connections API] Connections with matching client_id (string comparison):', matching.length);
      }
    }
    console.log('[Client Connections API] ===========================================');

    return NextResponse.json({
      success: true,
      connections: finalConnections
    });

  } catch (error) {
    console.error('[Client Connections API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
