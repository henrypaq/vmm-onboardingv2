#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found. Creating from template...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env.local from .env.example');
  } else {
    console.log('❌ .env.example not found either. Please create .env.local manually.');
    process.exit(1);
  }
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, 'utf8');

// Check for placeholder values
const placeholders = [
  'your_supabase_url_here',
  'your_supabase_anon_key_here', 
  'your_supabase_service_role_key_here'
];

const hasPlaceholders = placeholders.some(placeholder => envContent.includes(placeholder));

if (hasPlaceholders) {
  console.log('⚠️  .env.local contains placeholder values that need to be updated:');
  console.log('');
  console.log('Please update the following in .env.local:');
  console.log('1. NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL');
  console.log('2. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy ANON_KEY)');
  console.log('3. SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)');
  console.log('');
  console.log('You can find these in your Supabase dashboard:');
  console.log('https://supabase.com/dashboard/project/[your-project]/settings/api');
  console.log('');
} else {
  console.log('✅ .env.local appears to be properly configured!');
}

console.log('📋 Current environment variables:');
console.log('');

// Parse and display current values (masking secrets)
const lines = envContent.split('\n');
lines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      const displayValue = value.includes('your_') || value.includes('placeholder') 
        ? `❌ ${value}` 
        : `✅ ${value.substring(0, 8)}...`;
      console.log(`${key}=${displayValue}`);
    }
  }
});

console.log('');
console.log('🚀 Next steps:');
console.log('1. Update any placeholder values in .env.local');
console.log('2. Restart your development server: npm run dev');
console.log('3. For production, add these variables to Netlify environment settings');


