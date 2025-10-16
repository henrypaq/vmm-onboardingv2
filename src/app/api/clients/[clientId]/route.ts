import { NextRequest } from 'next/server';
import { getSupabaseClient, executeSupabaseOperation, handleApiRoute, safeJsonParse } from '@/lib/api/api-utils';
import { updateClient } from '@/lib/db/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return handleApiRoute('Get Client Details', async () => {
    const { clientId } = await params;
    const supabase = await getSupabaseClient();

    const client = await executeSupabaseOperation(
      () => supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single(),
      'Fetch client details'
    );

    return { client };
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return handleApiRoute('Update Client', async () => {
    const { clientId } = await params;
    const body = await safeJsonParse<{ full_name?: string; company_name?: string }>(request);
    
    const updates: any = {};
    if (typeof body.full_name === 'string') updates.full_name = body.full_name;
    if (typeof body.company_name === 'string') updates.company_name = body.company_name;

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updated = await updateClient(clientId, updates);
    return { client: updated };
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return handleApiRoute('Delete Client', async () => {
    const { clientId } = await params;
    const supabase = await getSupabaseClient();

    // Get client to know admin owner
    const client = await executeSupabaseOperation(
      () => supabase
        .from('clients')
        .select('id, admin_id')
        .eq('id', clientId)
        .single(),
      'Fetch client for deletion'
    );

    // Delete client platform connections
    await executeSupabaseOperation(
      () => supabase
        .from('client_platform_connections')
        .delete()
        .eq('client_id', clientId),
      'Delete platform connections'
    );

    // Delete the client
    await executeSupabaseOperation(
      () => supabase
        .from('clients')
        .delete()
        .eq('id', clientId),
      'Delete client'
    );

    return { success: true };
  });
}
