import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = createClient();
    const { clientId } = await params;

    console.log('[Client Connections API] Fetching connections for client:', clientId);

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
