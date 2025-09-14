// Test Supabase database connection
// Run with: node test-db-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    
    // Test table existence
    const tables = ['users', 'admin_platform_connections', 'onboarding_links', 'onboarding_requests', 'clients'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log(`⚠️  Table '${table}' not found or not accessible`);
      } else {
        console.log(`✅ Table '${table}' is accessible`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database setup verification complete!');
    console.log('📋 Next steps:');
    console.log('1. Run the database-setup.sql script in your Supabase SQL Editor');
    console.log('2. Verify all tables are created successfully');
    console.log('3. Test the application with real data');
  } else {
    console.log('\n❌ Database setup needs attention');
    console.log('📋 Troubleshooting:');
    console.log('1. Check your Supabase credentials in .env.local');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Run the database-setup.sql script first');
  }
});
