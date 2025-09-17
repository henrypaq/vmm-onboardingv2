import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add console warnings for missing environment variables
if (!supabaseUrl) {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is missing from server-side code.');
  console.warn('   For localhost: Add to .env.local file');
  console.warn('   For Netlify: Add to Site Settings > Environment Variables');
}

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing from server-side code.');
  console.warn('   For localhost: Add to .env.local file');
  console.warn('   For Netlify: Add to Site Settings > Environment Variables');
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables for server-side operations.');
  console.error('   Current values:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
