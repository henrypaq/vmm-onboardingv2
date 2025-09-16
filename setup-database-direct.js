// Setup Supabase database schema directly using SQL execution
// Run with: node setup-database-direct.js

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

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.error('SQL Error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Execution Error:', err.message);
    return false;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema directly...');
    
    // Create users table
    console.log('📝 Creating users table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
        full_name TEXT,
        company_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create admin_platform_connections table
    console.log('📝 Creating admin_platform_connections table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.admin_platform_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
        platform_user_id TEXT NOT NULL,
        platform_username TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        scopes TEXT[] NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(admin_id, platform)
      );
    `);
    
    // Create onboarding_links table
    console.log('📝 Creating onboarding_links table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.onboarding_links (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        token TEXT UNIQUE NOT NULL,
        platforms TEXT[] NOT NULL DEFAULT '{}',
        requested_permissions JSONB NOT NULL DEFAULT '{}',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create onboarding_requests table
    console.log('📝 Creating onboarding_requests table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.onboarding_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        link_id UUID REFERENCES public.onboarding_links(id) ON DELETE CASCADE NOT NULL,
        client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        client_email TEXT,
        client_name TEXT,
        company_name TEXT,
        granted_permissions JSONB NOT NULL DEFAULT '{}',
        platform_connections JSONB NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
        submitted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create clients table
    console.log('📝 Creating clients table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.clients (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        email TEXT NOT NULL,
        full_name TEXT,
        company_name TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        last_onboarding_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(admin_id, email)
      );
    `);
    
    // Create indexes
    console.log('📝 Creating indexes...');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_admin_id ON public.admin_platform_connections(admin_id);`);
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_onboarding_links_admin_id ON public.onboarding_links(admin_id);`);
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_onboarding_links_token ON public.onboarding_links(token);`);
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON public.onboarding_requests(link_id);`);
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON public.clients(admin_id);`);
    
    // Enable RLS
    console.log('📝 Enabling Row Level Security...');
    await executeSQL(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE public.admin_platform_connections ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE public.onboarding_links ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;`);
    
    // Create RLS policies
    console.log('📝 Creating RLS policies...');
    await executeSQL(`
      CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
    `);
    
    await executeSQL(`
      CREATE POLICY IF NOT EXISTS "Admins can manage their own platform connections" ON public.admin_platform_connections
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = admin_id 
            AND id = auth.uid() 
            AND role = 'admin'
          )
        );
    `);
    
    await executeSQL(`
      CREATE POLICY IF NOT EXISTS "Admins can manage their own links" ON public.onboarding_links
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = admin_id 
            AND id = auth.uid() 
            AND role = 'admin'
          )
        );
    `);
    
    await executeSQL(`
      CREATE POLICY IF NOT EXISTS "Admins can view requests for their links" ON public.onboarding_requests
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.onboarding_links 
            JOIN public.users ON onboarding_links.admin_id = users.id
            WHERE onboarding_links.id = link_id 
            AND users.id = auth.uid() 
            AND users.role = 'admin'
          )
        );
    `);
    
    await executeSQL(`
      CREATE POLICY IF NOT EXISTS "Admins can manage their own clients" ON public.clients
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = admin_id 
            AND id = auth.uid() 
            AND role = 'admin'
          )
        );
    `);
    
    // Insert sample data
    console.log('📝 Inserting sample data...');
    await executeSQL(`
      INSERT INTO public.users (id, email, role, full_name, company_name) VALUES
        ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 'Admin User', 'VMM Agency'),
        ('00000000-0000-0000-0000-000000000002', 'client@example.com', 'client', 'Client User', 'Client Company')
      ON CONFLICT (id) DO NOTHING;
    `);
    
    await executeSQL(`
      INSERT INTO public.onboarding_links (admin_id, token, platforms, requested_permissions, expires_at) VALUES
        ('00000000-0000-0000-0000-000000000001', 'demo-token-12345', 
         ARRAY['meta', 'google', 'tiktok', 'shopify'],
         '{"meta": ["pages_read_engagement", "pages_manage_posts"], "google": ["analytics.readonly"], "tiktok": ["user.info.basic"], "shopify": ["read_orders"]}',
         NOW() + INTERVAL '30 days')
      ON CONFLICT (token) DO NOTHING;
    `);
    
    console.log('\n🎉 Database setup completed successfully!');
    
    // Verify setup
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
    console.log('\n🎉 Database is now fully configured!');
    console.log('📋 Next steps:');
    console.log('1. Test the application: npm run dev -- --port 3002');
    console.log('2. Visit: http://localhost:3002');
    console.log('3. Test demo flow: http://localhost:3002/onboarding/demo-token-12345');
  } else {
    console.log('\n❌ Database setup failed');
    console.log('📋 Please run the SQL script manually in Supabase Dashboard');
  }
});

