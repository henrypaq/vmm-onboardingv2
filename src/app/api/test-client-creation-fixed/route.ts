import { NextRequest, NextResponse } from 'next/server';
import { createClient, getClients } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company } = await request.json();
    
    console.log('[Test] Creating client with data:', { name, email, company });
    
    const testClient = await createClient({
      admin_id: '00000000-0000-0000-0000-000000000001', // Mock admin ID
      email: email || 'test@example.com',
      full_name: name || 'Test User',
      company_name: company || 'Test Company',
      status: 'active',
      last_onboarding_at: new Date().toISOString()
    });
    
    console.log('[Test] Created client:', testClient);
    
    // Fetch all clients to verify
    const allClients = await getClients('00000000-0000-0000-0000-000000000001');
    console.log('[Test] All clients:', allClients);
    
    return NextResponse.json({
      success: true,
      createdClient: testClient,
      allClients: allClients
    });
  } catch (error) {
    console.error('[Test] Error creating client:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test client',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const clients = await getClients('00000000-0000-0000-0000-000000000001');
    
    return NextResponse.json({
      success: true,
      clients: clients
    });
  } catch (error) {
    console.error('[Test] Error fetching clients:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch clients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
