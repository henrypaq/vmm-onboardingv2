#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up .env.local file...\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
  fs.copyFileSync(envPath, envPath + '.backup');
}

// Create .env.local with the correct structure
const envContent = `# Environment Variables for VMM Onboarding Platform
# IMPORTANT: Replace the placeholder values with your actual credentials

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Meta (Facebook) OAuth Configuration
NEXT_PUBLIC_META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://vast-onboarding.netlify.app
`;

fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env.local file');
console.log('');
console.log('📋 Next steps:');
console.log('1. Open .env.local in your editor');
console.log('2. Replace the placeholder values with your actual credentials:');
console.log('');
console.log('   For Supabase (get from https://supabase.com/dashboard):');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('');
console.log('   For Meta OAuth (get from https://developers.facebook.com):');
console.log('   - NEXT_PUBLIC_META_APP_ID (this is your App ID)');
console.log('   - META_APP_SECRET (this is your App Secret)');
console.log('');
console.log('   For Google OAuth (get from https://console.cloud.google.com):');
console.log('   - GOOGLE_CLIENT_ID');
console.log('   - GOOGLE_CLIENT_SECRET');
console.log('');
console.log('3. Save the file and restart your development server');
console.log('');
console.log('🚀 The app will then use these credentials for OAuth flows!');
