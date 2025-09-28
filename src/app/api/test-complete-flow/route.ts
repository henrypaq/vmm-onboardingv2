import { NextRequest, NextResponse } from 'next/server';
import { createClient, getClients, createOnboardingRequest, updateOnboardingLink, getOnboardingLinkByToken } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, token } = await request.json();
    
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    console.log(`[Test Complete Flow] Starting test for admin ${adminId}`);
    console.log(`[Test Complete Flow] Client data:`, { name, email, company });
    
    // Step 1: Create a test client
    console.log(`[Test Complete Flow] Step 1: Creating client...`);
    const newClient = await createClient({
      admin_id: adminId,
      email: email || 'test-complete@example.com',
      full_name: name || 'Test Complete Client',
      company_name: company || 'Test Complete Company',
      status: 'active',
      last_onboarding_at: new Date().toISOString()
    });
    console.log(`[Test Complete Flow] Created client:`, newClient);
    
    // Step 2: Get the link if token provided
    let link = null;
    if (token) {
      console.log(`[Test Complete Flow] Step 2: Getting link for token ${token}...`);
      link = await getOnboardingLinkByToken(token);
      console.log(`[Test Complete Flow] Found link:`, link);
      
      if (link) {
        // Step 3: Create onboarding request
        console.log(`[Test Complete Flow] Step 3: Creating onboarding request...`);
        const onboardingRequest = await createOnboardingRequest({
          link_id: link.id,
          client_id: newClient.id,
          client_email: newClient.email,
          client_name: newClient.full_name,
          company_name: newClient.company_name,
          granted_permissions: { test: ['test_scope'] },
          platform_connections: { test: { access_token: 'test_token' } },
          status: 'completed'
        });
        console.log(`[Test Complete Flow] Created onboarding request:`, onboardingRequest);
        
        // Step 4: Mark link as used
        console.log(`[Test Complete Flow] Step 4: Marking link as used...`);
        await updateOnboardingLink(link.id, {
          is_used: true
        });
        console.log(`[Test Complete Flow] Marked link as used`);
      }
    }
    
    // Step 5: Fetch all clients to verify
    console.log(`[Test Complete Flow] Step 5: Fetching all clients...`);
    const allClients = await getClients(adminId);
    console.log(`[Test Complete Flow] All clients for admin:`, allClients);
    
    return NextResponse.json({
      success: true,
      createdClient: newClient,
      allClients: allClients,
      link: link,
      message: 'Complete flow test successful'
    });
    
  } catch (error) {
    console.error('Test complete flow error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test complete flow', 
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
      count: clients.length
    });
    
  } catch (error) {
    console.error('Test get clients error:', error);
    return NextResponse.json(
      { error: 'Failed to get clients', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
