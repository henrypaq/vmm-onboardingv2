#!/usr/bin/env node

console.log('🔍 Testing Supabase Client Configuration...\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('📋 Environment Variables:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log(`Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log(`Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
}

console.log('\n🧪 Testing Supabase Client Creation:');

try {
  // Test client-side client
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  if (supabaseUrl.includes('your_') || supabaseAnonKey.includes('your_')) {
    throw new Error('Supabase credentials are still placeholder values. Please update .env.local with actual Supabase credentials.');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Client-side Supabase client created successfully');
  
  // Test server-side client
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  
  if (supabaseServiceKey.includes('your_')) {
    throw new Error('Supabase service key is still a placeholder value. Please update .env.local with actual Supabase credentials.');
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Server-side Supabase client created successfully');
  
  console.log('\n🎯 Supabase Configuration Summary:');
  console.log('✅ All environment variables are present');
  console.log('✅ Client-side client can be created');
  console.log('✅ Server-side client can be created');
  console.log('✅ Configuration looks correct');
  
} catch (error) {
  console.error('❌ Error creating Supabase clients:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check that .env.local exists and contains the required variables');
  console.log('2. Verify the Supabase URL and keys are correct');
  console.log('3. Make sure the environment variables are loaded properly');
}
