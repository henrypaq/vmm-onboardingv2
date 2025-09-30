import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient as createClientRecord } from '@/lib/db/database';

export async function GET() {
  try {
    // Proactive env diagnostics to avoid opaque 500s in hosting environments
    const envDiagnostics = {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    };
    if (!envDiagnostics.NEXT_PUBLIC_SUPABASE_URL || !envDiagnostics.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Clients API] Missing required Supabase envs', envDiagnostics);
    }
    // TODO: Implement proper authentication
    // const session = await requireAuth('admin');
    
    // Temporary: Use a default admin ID for testing
    // In production, this should come from the authenticated session
    const adminId = '00000000-0000-0000-0000-000000000001';
    console.log(`[Clients API] Fetching clients for admin: ${adminId}`);
    
    const clients = await getClients(adminId);
    console.log(`[Clients API] Found ${clients.length} clients:`, clients.map(c => ({ id: c.id, email: c.email, name: c.full_name })));
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[Clients API] Get clients error:', error);
    // Surface richer diagnostics to help fix production env issues quickly
    return NextResponse.json(
      {
        error: 'Failed to fetch clients',
        details: error instanceof Error ? error.message : String(error),
        env: {
          NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    // const session = await requireAuth('admin');
    
    const clientData = await request.json();
    
    if (!clientData.name || !clientData.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const client = await createClientRecord({
      ...clientData,
      status: 'active',
    });
    
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
