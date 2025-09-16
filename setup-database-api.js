// Setup Supabase database schema using REST API
// Run with: node setup-database-api.js

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

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema via Supabase API...');
    
    // Test connection first
    console.log('🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && testError.code === 'PGRST116') {
      console.log('📝 Users table does not exist, creating schema...');
    } else if (testError) {
      console.error('❌ Connection test failed:', testError);
      return false;
    } else {
      console.log('✅ Database already has tables, checking structure...');
    }
    
    // Since we can't execute raw SQL through the client, let's verify what we can do
    console.log('📋 Checking available operations...');
    
    // Try to create a simple test record to verify permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        company_name: 'VMM Agency'
      }])
      .select();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('❌ Users table does not exist. Manual setup required.');
        console.log('📋 Please run the following in Supabase SQL Editor:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy/paste the contents of database-setup.sql');
        console.log('5. Click "Run"');
        return false;
      } else {
        console.log('⚠️  User creation error:', userError.message);
      }
    } else {
      console.log('✅ Users table exists and is accessible');
    }
    
    // Check other tables
    const tables = ['admin_platform_connections', 'onboarding_links', 'onboarding_requests', 'clients'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`❌ Table '${table}' does not exist`);
          } else {
            console.log(`⚠️  Table '${table}' error:`, error.message);
          }
        } else {
          console.log(`✅ Table '${table}' is accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
    console.log('\n📋 Database Status Summary:');
    console.log('The Supabase client can only read/write data, not create schema.');
    console.log('You need to create the database schema manually in Supabase Dashboard.');
    
    return false; // Indicate manual setup is needed
    
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    return false;
  }
}

setupDatabase().then(success => {
  if (success) {
    console.log('\n🎉 Database is fully configured!');
  } else {
    console.log('\n📋 Manual Database Setup Required');
    console.log('=====================================');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project: offtqzjqjsdojmedaetv');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Copy the entire contents of database-setup.sql');
    console.log('6. Paste into the SQL Editor');
    console.log('7. Click "Run" to execute');
    console.log('');
    console.log('After running the SQL script, test with:');
    console.log('node test-db-connection.js');
  }
});

