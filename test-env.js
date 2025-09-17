// Test script to verify environment variables are loaded correctly
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Test:');
console.log('========================');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ MISSING');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ MISSING');
console.log('META_APP_ID:', process.env.META_APP_ID || '❌ MISSING');
console.log('META_APP_SECRET:', process.env.META_APP_SECRET ? '✅ Present' : '❌ MISSING');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '❌ MISSING');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Present' : '❌ MISSING');
console.log('TIKTOK_CLIENT_KEY:', process.env.TIKTOK_CLIENT_KEY || '❌ MISSING');
console.log('SHOPIFY_CLIENT_ID:', process.env.SHOPIFY_CLIENT_ID || '❌ MISSING');
console.log('SHOPIFY_SHOP_DOMAIN:', process.env.SHOPIFY_SHOP_DOMAIN || '❌ MISSING');

