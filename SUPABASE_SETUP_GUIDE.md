# Supabase Setup Guide 🔧

## Current Status
✅ **Supabase client files created and configured**
✅ **Database functions updated to use new clients**
✅ **Error handling implemented for missing credentials**
❌ **Supabase credentials still need to be added to .env.local**

## What I've Set Up

### 1. Supabase Client Files ✅
- **`src/lib/supabaseClient.ts`** - Frontend client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`src/lib/supabaseAdmin.ts`** - Server-side client using `SUPABASE_SERVICE_ROLE_KEY`
- **Updated `src/lib/db/database.ts`** - Now uses the new `supabaseAdmin` client

### 2. Error Handling ✅
- Clear error messages when environment variables are missing
- Detection of placeholder values in credentials
- Proper validation of Supabase URLs and keys

## What You Need to Do

### Step 1: Get Your Supabase Credentials
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

### Step 2: Update .env.local
Replace the placeholder values in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OAuth Credentials (already configured)
META_APP_ID=[Your Meta App ID]
META_APP_SECRET=[Your Meta App Secret]
GOOGLE_CLIENT_ID=[Your Google Client ID]
GOOGLE_CLIENT_SECRET=[Your Google Client Secret]

# App Configuration
NEXT_PUBLIC_APP_URL=https://vast-onboarding.netlify.app
```

### Step 3: Test the Setup
Run the test script to verify everything is working:

```bash
node test-supabase-client.js
```

You should see:
```
✅ All environment variables are present
✅ Client-side client can be created
✅ Server-side client can be created
✅ Configuration looks correct
```

### Step 4: Test the Admin Settings Page
1. Visit: http://localhost:3000/admin/settings
2. The page should load without the "supabaseKey is required" error
3. You should see the platform connection cards

## Troubleshooting

### If you still get "supabaseKey is required" error:
1. **Check .env.local exists** and contains the correct values
2. **Restart your development server** after updating .env.local
3. **Verify the Supabase URL** starts with `https://` and ends with `.supabase.co`
4. **Check the keys** are complete and not truncated

### If the test script fails:
1. **Verify credentials** are copied correctly from Supabase dashboard
2. **Check for extra spaces** or characters in the .env.local file
3. **Ensure .env.local** is in the project root directory

### If the admin settings page doesn't load:
1. **Check browser console** for specific error messages
2. **Verify database tables** exist in your Supabase project
3. **Check network tab** for failed API requests

## File Structure
```
src/lib/
├── supabaseClient.ts    # Frontend Supabase client
├── supabaseAdmin.ts     # Server-side Supabase client
└── db/
    └── database.ts      # Database functions (updated)
```

## Next Steps After Setup
1. **Test OAuth flows** - Admin and client OAuth should work
2. **Verify database operations** - Create/read operations should work
3. **Deploy to Netlify** - Add the same environment variables to Netlify

The Supabase client setup is now complete and ready for your actual credentials! 🚀
