#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing OAuth Configuration...\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'META_APP_ID',
  'META_APP_SECRET', 
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

console.log('📋 Environment Variables Check:');
let allPresent = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && !value.includes('your_') && !value.includes('placeholder')) {
    console.log(`✅ ${envVar}: ${value.substring(0, 8)}...`);
  } else {
    console.log(`❌ ${envVar}: Missing or placeholder value`);
    allPresent = false;
  }
});

console.log('\n🔗 OAuth URLs Test:');

// Test Google OAuth URL generation
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (googleClientId && appUrl) {
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${appUrl}/api/oauth/admin/connect/google`,
    scope: 'https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords',
    response_type: 'code',
    state: 'test_state'
  })}`;
  
  console.log('✅ Google OAuth URL generated successfully');
  console.log(`   URL: ${googleOAuthUrl.substring(0, 100)}...`);
} else {
  console.log('❌ Google OAuth URL generation failed - missing credentials');
}

// Test Meta OAuth URL generation
const metaAppId = process.env.META_APP_ID;

if (metaAppId && appUrl) {
  const metaOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${new URLSearchParams({
    client_id: metaAppId,
    redirect_uri: `${appUrl}/api/oauth/admin/connect/meta`,
    scope: 'pages_read_engagement,pages_manage_posts,ads_read,pages_show_list',
    response_type: 'code',
    state: 'test_state'
  })}`;
  
  console.log('✅ Meta OAuth URL generated successfully');
  console.log(`   URL: ${metaOAuthUrl.substring(0, 100)}...`);
} else {
  console.log('❌ Meta OAuth URL generation failed - missing credentials');
}

console.log('\n🎯 Redirect URIs to Configure:');
console.log('Add these to your OAuth app settings:');
console.log('');
console.log('Google OAuth Console:');
console.log(`  - ${appUrl}/api/oauth/admin/connect/google`);
console.log(`  - ${appUrl}/api/oauth/client/connect/google`);
console.log('');
console.log('Meta App Settings:');
console.log(`  - ${appUrl}/api/oauth/admin/connect/meta`);
console.log(`  - ${appUrl}/api/oauth/client/connect/meta`);

console.log('\n📊 Summary:');
if (allPresent) {
  console.log('✅ All OAuth credentials are properly configured!');
  console.log('✅ OAuth URLs are generating correctly');
  console.log('✅ Ready for testing OAuth flows');
} else {
  console.log('❌ Some OAuth credentials are missing or have placeholder values');
  console.log('❌ Please update .env.local with actual credentials');
}

console.log('\n🚀 Next Steps:');
console.log('1. Verify redirect URIs are added to your OAuth apps');
console.log('2. Test admin OAuth flow: /admin/settings');
console.log('3. Test client OAuth flow: /onboarding/[token]');
