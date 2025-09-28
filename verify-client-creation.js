// Simple script to verify client creation is working
const { createClient, getClients } = require('./src/lib/db/database.ts');

async function testClientCreation() {
  try {
    console.log('Testing client creation...');
    
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    // Test creating a client
    const testClient = await createClient({
      admin_id: adminId,
      email: 'test-verification@example.com',
      full_name: 'Test Verification Client',
      company_name: 'Test Company',
      status: 'active',
      last_onboarding_at: new Date().toISOString()
    });
    
    console.log('✅ Client created successfully:', testClient);
    
    // Test fetching clients
    const allClients = await getClients(adminId);
    console.log('✅ Clients fetched successfully:', allClients.length, 'clients found');
    
    allClients.forEach(client => {
      console.log(`  - ${client.full_name} (${client.email}) - ${client.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testClientCreation();
