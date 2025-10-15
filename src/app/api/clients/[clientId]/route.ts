import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { updateClient, deleteAdminPlatformConnectionByAdminAndPlatform } from '@/lib/db/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { clientId } = await params;

    console.log('[Client Details API] Fetching client details for:', clientId);

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('[Client Details API] Error fetching client:', clientError);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('[Client Details API] Client found:', client);

    return NextResponse.json({
      success: true,
      client
    });

  } catch (error) {
    console.error('[Client Details API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Rename/update a client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    const updates: any = {};
    if (typeof body.full_name === 'string') updates.full_name = body.full_name;
    if (typeof body.company_name === 'string') updates.company_name = body.company_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await updateClient(clientId, updates);
    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error('[Client PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// Delete a client and their platform connections
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { clientId } = await params;

    // Get client to know admin owner
    const { data: client } = await supabase
      .from('clients')
      .select('id, admin_id')
      .eq('id', clientId)
      .single();

    // Best-effort: mark any admin connections for this admin as inactive for safety (optional)
    // Skipped: handled per-account via UI normally

    // Delete client platform connections
    const { error: delConnErr } = await supabase
      .from('client_platform_connections')
      .delete()
      .eq('client_id', clientId);
    if (delConnErr) console.warn('[Client DELETE] Failed deleting platform connections', delConnErr);

    // Delete the client
    const { error: delClientErr } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    if (delClientErr) {
      console.error('[Client DELETE] Failed deleting client', delClientErr);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Client DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
