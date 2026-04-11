#!/usr/bin/env node

/**
 * Interactive script to update .env.local with new Supabase credentials
 * Run: node setup-new-supabase.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 New Supabase Project Setup\n');
  console.log('This script will help you update your .env.local file with new Supabase credentials.\n');
  console.log('You can find these in your Supabase dashboard:');
  console.log('  Settings → API → Project URL and API keys\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  // Check if .env.local exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    console.log('Creating a new one...\n');
  } else {
    console.log('📝 Found existing .env.local file');
    console.log('We\'ll update the Supabase credentials while keeping your OAuth settings.\n');
  }

  // Read existing .env.local if it exists
  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        existingEnv[match[1].trim()] = match[2].trim();
      }
    });
  }

  // Get new Supabase credentials
  console.log('Please enter your NEW Supabase credentials:\n');

  const supabaseUrl = await question('NEXT_PUBLIC_SUPABASE_URL: ');
  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    console.log('❌ Invalid Supabase URL. Should be like: https://xxxxx.supabase.co');
    process.exit(1);
  }

  const anonKey = await question('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or anon JWT): ');
  if (!anonKey || anonKey.length < 50) {
    console.log('❌ Invalid anon key. Please check you copied the full key.');
    process.exit(1);
  }

  const serviceRoleKey = await question('SUPABASE_SECRET_KEY (or service_role JWT): ');
  if (!serviceRoleKey || serviceRoleKey.length < 50) {
    console.log('❌ Invalid service role key. Please check you copied the full key.');
    process.exit(1);
  }

  // Build new .env.local content
  const envLines = [
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${anonKey}`,
    `SUPABASE_SECRET_KEY=${serviceRoleKey}`,
    ''
  ];

  // Preserve existing OAuth credentials
  const oauthKeys = [
    'NEXT_PUBLIC_META_APP_ID',
    'META_APP_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];

  oauthKeys.forEach(key => {
    if (existingEnv[key]) {
      envLines.push(`${key}=${existingEnv[key]}`);
    }
  });

  // Write to file
  const content = envLines.join('\n');
  fs.writeFileSync(envPath, content, 'utf8');

  console.log('\n✅ Successfully updated .env.local!');
  console.log('\n📋 Next steps:');
  console.log('  1. Run the database schema script in Supabase SQL Editor');
  console.log('  2. Run: node verify-new-supabase-setup.js');
  console.log('  3. Start your dev server: npm run dev\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
