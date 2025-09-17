import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add console warnings for missing environment variables
if (!supabaseUrl) {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is missing. Please check your environment variables.');
  console.warn('   For localhost: Add to .env.local file');
  console.warn('   For Netlify: Add to Site Settings > Environment Variables');
}

if (!supabaseAnonKey) {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Please check your environment variables.');
  console.warn('   For localhost: Add to .env.local file');
  console.warn('   For Netlify: Add to Site Settings > Environment Variables');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. App will not work correctly.');
  console.error('   Current values:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export for convenience
export default supabase;
