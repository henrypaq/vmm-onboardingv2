import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = getSupabaseAdmin();
    
    console.log(`[Get Token] Fetching token for client: ${clientId}`);
    
    // Get the client's platform connections
    const { data: connections, error } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Get Token] Error fetching connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: 'No active Meta connection found for this client' }, { status: 404 });
    }

    const connection = connections[0];
    
    return NextResponse.json({
      success: true,
      token: connection.access_token,
      platform: connection.platform,
      platformUserId: connection.platform_user_id,
      platformUsername: connection.platform_username,
      scopes: connection.scopes,
      tokenExpiresAt: connection.token_expires_at,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at
    });

  } catch (error) {
    console.error('[Get Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
}
