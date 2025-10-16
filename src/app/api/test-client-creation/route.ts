import { NextRequest, NextResponse } from 'next/server';
import { createClient, getClients } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company } = await request.json();
    
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    console.log(`[Test] Creating test client for admin ${adminId}`);
    console.log(`[Test] Client data:`, { name, email, company });
    
    // Create a test client
    const newClient = await createClient({
      admin_id: adminId,
      email: email || 'test@example.com',
      full_name: name || 'Test Client',
      company_name: company || 'Test Company',
      status: 'active',
      last_onboarding_at: new Date().toISOString()
    });
    
    console.log(`[Test] Created client:`, newClient);
    
    // Fetch all clients to verify
    const allClients = await getClients(adminId);
    console.log(`[Test] All clients for admin:`, allClients);
    
    return NextResponse.json({
      success: true,
      createdClient: newClient,
      allClients: allClients
    });
    
  } catch (error) {
    console.error('Test client creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create test client', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminId = '00000000-0000-0000-0000-000000000001';
    const clients = await getClients(adminId);
    
    return NextResponse.json({
      success: true,
      clients: clients
    });
    
  } catch (error) {
    console.error('Test get clients error:', error);
    return NextResponse.json(
      { error: 'Failed to get clients', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
