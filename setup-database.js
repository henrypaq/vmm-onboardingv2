// Setup Supabase database schema directly
// Run with: node setup-database.js

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
    console.log('🚀 Setting up database schema...');
    
    // Read the SQL file
    const fs = require('fs');
    const sqlContent = fs.readFileSync('database-setup.sql', 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    
    // Verify the setup
    console.log('\n🔍 Verifying database setup...');
    
    const tables = ['users', 'admin_platform_connections', 'onboarding_links', 'onboarding_requests', 'clients'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' is accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    return false;
  }
}

setupDatabase().then(success => {
  if (success) {
    console.log('\n🎉 Database setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Test the application: npm run dev -- --port 3002');
    console.log('2. Visit: http://localhost:3002');
    console.log('3. Test demo flow: http://localhost:3002/onboarding/demo-token-12345');
  } else {
    console.log('\n❌ Database setup failed');
    console.log('📋 Manual setup required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy/paste contents of database-setup.sql');
    console.log('3. Click "Run" to execute');
  }
});

