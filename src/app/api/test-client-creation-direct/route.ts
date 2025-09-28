import { NextRequest, NextResponse } from 'next/server';
import { createClient, getClientByEmail, getClients } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company } = await request.json();
    
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    console.log(`[Test Direct Client] Starting direct client creation test`);
    console.log(`[Test Direct Client] Admin ID: ${adminId}`);
    console.log(`[Test Direct Client] Client data:`, { name, email, company });
    
    // Step 1: Check if client already exists
    console.log(`[Test Direct Client] Step 1: Checking for existing client...`);
    const existingClient = await getClientByEmail(adminId, email);
    console.log(`[Test Direct Client] Existing client check result:`, existingClient);
    
    let client;
    if (existingClient) {
      console.log(`[Test Direct Client] Client already exists: ${existingClient.id}`);
      client = existingClient;
    } else {
      // Step 2: Create new client
      console.log(`[Test Direct Client] Step 2: Creating new client...`);
      try {
        client = await createClient({
          admin_id: adminId,
          email: email,
          full_name: name,
          company_name: company,
          status: 'active',
          last_onboarding_at: new Date().toISOString()
        });
        console.log(`[Test Direct Client] Successfully created client:`, client);
      } catch (createError) {
        console.error(`[Test Direct Client] Failed to create client:`, createError);
        throw createError;
      }
    }
    
    // Step 3: Verify client was created/retrieved
    console.log(`[Test Direct Client] Step 3: Verifying client...`);
    const allClients = await getClients(adminId);
    console.log(`[Test Direct Client] All clients for admin:`, allClients);
    
    // Step 4: Check if our client is in the list
    const clientInList = allClients.find(c => c.id === client.id);
    console.log(`[Test Direct Client] Client found in list:`, !!clientInList);
    
    return NextResponse.json({
      success: true,
      createdClient: client,
      allClients: allClients,
      clientInList: !!clientInList,
      message: 'Direct client creation test completed'
    });
    
  } catch (error) {
    console.error('Test direct client creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test direct client creation', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
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
      clients: clients,
      count: clients.length,
      adminId: adminId
    });
    
  } catch (error) {
    console.error('Test get clients error:', error);
    return NextResponse.json(
      { error: 'Failed to get clients', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
