// Verify database setup
// Run with: node verify-database.js

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

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  try {
    // Check auth.users table
    console.log('📋 Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(5);
    
    if (authError) {
      console.log('❌ Error accessing auth.users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers?.length || 0} auth users:`);
      authUsers?.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
    
    // Check public.users table
    console.log('\n📋 Checking public.users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Error accessing users:', usersError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} users:`);
      users?.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.full_name} at ${user.company_name}`);
      });
    }
    
    // Check onboarding_links table
    console.log('\n📋 Checking onboarding_links...');
    const { data: links, error: linksError } = await supabase
      .from('onboarding_links')
      .select('*');
    
    if (linksError) {
      console.log('❌ Error accessing onboarding_links:', linksError.message);
    } else {
      console.log(`✅ Found ${links?.length || 0} onboarding links:`);
      links?.forEach(link => {
        console.log(`   - Token: ${link.token} (${link.status})`);
        console.log(`     Platforms: ${link.platforms.join(', ')}`);
        console.log(`     Expires: ${new Date(link.expires_at).toLocaleDateString()}`);
      });
    }
    
    // Check other tables
    const tables = [
      'admin_platform_connections',
      'onboarding_requests', 
      'clients'
    ];
    
    for (const table of tables) {
      console.log(`\n📋 Checking ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ Found ${data?.length || 0} records in ${table}`);
        if (data && data.length > 0) {
          console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
        }
      }
    }
    
    // Test foreign key relationships
    console.log('\n🔗 Testing foreign key relationships...');
    const { data: relationshipTest, error: relError } = await supabase
      .from('onboarding_links')
      .select(`
        id,
        token,
        admin_id,
        users!inner(email, role, full_name)
      `);
    
    if (relError) {
      console.log('❌ Foreign key relationship test failed:', relError.message);
    } else {
      console.log('✅ Foreign key relationships working correctly');
      relationshipTest?.forEach(link => {
        console.log(`   - Link ${link.token} belongs to ${link.users.email} (${link.users.role})`);
      });
    }
    
    console.log('\n🎉 Database verification complete!');
    
    if (users && users.length > 0 && links && links.length > 0) {
      console.log('\n✅ Database setup looks good! You can now:');
      console.log('1. Run: npm run dev');
      console.log('2. Visit: http://localhost:3002');
      console.log('3. Test demo: http://localhost:3002/onboarding/demo-token-12345');
      console.log('4. Login with admin@example.com / password123');
    } else {
      console.log('\n⚠️  Some expected data is missing. You may need to re-run the database setup.');
    }
    
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  }
}

verifyDatabase();
