# New Supabase Project Setup Guide

## 🚨 Your Previous Supabase Project Was Paused

Since your Supabase project was paused for 90+ days and cannot be recovered, follow these steps to set up a fresh database that matches your existing project exactly.

---

## Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in with your account

2. **Create New Project**
   - Click "New Project"
   - Fill in the details:
     - **Name**: `vmm-onboarding` (or your preferred name)
     - **Database Password**: Generate a strong password (save it securely)
     - **Region**: Choose closest to your users
     - **Pricing Plan**: Select appropriate plan (Free tier works for development)

3. **Wait for Project Setup**
   - This takes 1-2 minutes
   - You'll see a loading screen while Supabase provisions your database

---

## Step 2: Get Your New Supabase Credentials

Once your project is ready:

1. **Go to Project Settings**
   - Click the gear icon (⚙️) in the left sidebar
   - Select "API" from the settings menu

2. **Copy Your Credentials**
   You'll need these three values:
   - **Project URL**: Found under "Project URL" (looks like `https://xxxxx.supabase.co`)
   - **anon/public key**: Found under "Project API keys" → "anon" `public` key
   - **service_role key**: Found under "Project API keys" → "service_role" key (⚠️ Keep this secret!)

3. **Save These Credentials**
   - You'll need them in the next step

---

## Step 3: Update Environment Variables

### Option A: Update `.env.local` Manually

Open `.env.local` and replace the old Supabase credentials with your new ones:

```env
# Replace these with your NEW Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key-here

# Keep your existing OAuth credentials (these don't change)
# Replace these with your actual OAuth credentials
NEXT_PUBLIC_META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Option B: Use the Setup Script

Run the setup script to update your environment variables interactively:

```bash
node setup-new-supabase.js
```

---

## Step 4: Create Database Schema

1. **Open Supabase SQL Editor**
   - In your Supabase dashboard, click "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run the Complete Schema Script**
   - Open the file: `complete-database-definitive-updated.sql`
   - Copy the **ENTIRE** contents (all 367 lines)
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

3. **Verify Success**
   - You should see a success message in the output
   - Check for any errors (there shouldn't be any)

---

## Step 5: Verify Database Setup

Run the verification script to test your connection:

```bash
node verify-new-supabase-setup.js
```

This will:
- ✅ Test connection to your new Supabase project
- ✅ Verify all tables were created
- ✅ Check RLS policies are enabled
- ✅ Verify indexes exist
- ✅ Test basic queries

---

## Step 6: Test the Application

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication**
   - Visit: http://localhost:3000/signup
   - Create a new admin account
   - Verify email (check your email inbox)
   - Login at: http://localhost:3000/login

3. **Test Admin Dashboard**
   - After login, you should be redirected to `/admin`
   - Verify you can see the dashboard

4. **Test Link Generation**
   - Go to `/admin/links`
   - Generate a test onboarding link
   - Verify it's saved in the database

---

## Step 7: Update Production Environment (Netlify)

If you're deploying to Netlify, update your environment variables:

1. **Go to Netlify Dashboard**
   - Navigate to your site settings
   - Go to "Environment variables"

2. **Update Supabase Variables**
   Update these three variables:
   - `NEXT_PUBLIC_SUPABASE_URL` → Your new project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Your new anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → Your new service role key

3. **Redeploy**
   - Trigger a new deployment
   - Or push a commit to trigger auto-deploy

---

## Step 8: Update OAuth Redirect URIs

Since you have a new Supabase project, you may need to update OAuth redirect URIs if your app URL changed.

### Google OAuth Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client
3. Update authorized redirect URIs:
   ```
   https://your-app-url.netlify.app/api/oauth/admin/connect/google
   https://your-app-url.netlify.app/api/oauth/client/connect/google
   ```

### Meta App Settings
1. Go to: https://developers.facebook.com/apps
2. Select your app
3. Go to "Settings" → "Basic"
4. Update "Valid OAuth Redirect URIs":
   ```
   https://your-app-url.netlify.app/api/oauth/admin/connect/meta
   https://your-app-url.netlify.app/api/oauth/client/connect/meta
   ```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] New Supabase project created
- [ ] Environment variables updated in `.env.local`
- [ ] Database schema created successfully
- [ ] Verification script passes all checks
- [ ] Can sign up new user
- [ ] Can login with new user
- [ ] Admin dashboard loads
- [ ] Can generate onboarding links
- [ ] OAuth redirect URIs updated (if needed)
- [ ] Production environment variables updated (if deploying)

---

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` has all three Supabase variables
- Restart your dev server after updating `.env.local`

### "Table doesn't exist" errors
- Make sure you ran the complete SQL script
- Check the SQL Editor output for errors
- Verify tables exist in Supabase dashboard → Table Editor

### "RLS policy violation" errors
- This is normal - RLS is working correctly
- Make sure you're authenticated when accessing protected data
- Check that user profile exists in `users` table

### "Connection refused" or "Invalid API key"
- Double-check your credentials in `.env.local`
- Make sure you copied the full keys (they're long!)
- Verify project is active in Supabase dashboard

---

## 📝 What Was Recreated

Your new database includes:

✅ **6 Tables:**
- `users` - User profiles with roles
- `admin_platform_connections` - Admin OAuth connections
- `clients` - Client management
- `onboarding_links` - Generated onboarding links
- `onboarding_requests` - Client submissions
- `client_platform_connections` - Client OAuth connections

✅ **Security:**
- Row Level Security (RLS) enabled
- Proper access policies for admin/client roles
- Public access for onboarding links

✅ **Performance:**
- Indexes on all key columns
- Optimized queries

✅ **Automation:**
- Auto-update triggers for `updated_at` timestamps
- Utility functions for token validation

---

## 🎉 You're All Set!

Your project should now work exactly as before, just with a fresh database. All your code remains the same - only the database connection changed.

If you encounter any issues, check the troubleshooting section or review the Supabase logs in your dashboard.
