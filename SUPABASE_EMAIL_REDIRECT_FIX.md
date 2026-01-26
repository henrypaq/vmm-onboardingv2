# Supabase Email Redirect Configuration Fix

## Problem
When clicking the Supabase email confirmation link, users are redirected to `localhost:3000` instead of the production app URL.

## Root Cause
Supabase email confirmation links use the **Site URL** configured in the Supabase Dashboard, not just the `emailRedirectTo` parameter in code. If the Site URL is set to `localhost`, all email links will redirect there.

## Solution

### 1. Update Supabase Dashboard Site URL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Update the **Site URL** to your production URL:
   ```
   https://vmm-onboarding.netlify.app
   ```
   (or your actual Netlify URL)

5. In the **Redirect URLs** section, add:
   ```
   https://vmm-onboarding.netlify.app/auth/callback
   https://vmm-onboarding.netlify.app/**
   ```

6. Click **Save**

### 2. Code Changes (Already Applied)

The code has been updated to:
- Use `/auth/callback` as the email redirect endpoint (standard Supabase callback route)
- Use `NEXT_PUBLIC_APP_URL` environment variable for the redirect URL
- Include `emailRedirectTo` in both API route and client-side signup

### 3. Environment Variables

Make sure `NEXT_PUBLIC_APP_URL` is set correctly:

**In `.env.local` (for local development):**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**In Netlify (for production):**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add or update:
   ```
   NEXT_PUBLIC_APP_URL=https://vmm-onboarding.netlify.app
   ```

### 4. Verify the Fix

After updating the Supabase Site URL:
1. Create a new test account
2. Check the email confirmation link - it should now point to your production URL
3. Click the link - it should redirect to `/auth/callback` on your production site

## Important Notes

- The **Site URL** in Supabase Dashboard is the primary setting that controls email redirects
- The `emailRedirectTo` parameter in code is a fallback, but Supabase will still use the Site URL as the base
- Always use `/auth/callback` for email verification redirects (this is the standard Supabase callback route)
- The redirect URL must be in the **Redirect URLs** allowlist in Supabase Dashboard

## Testing

1. **Local Development:**
   - Site URL should be: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

2. **Production:**
   - Site URL should be: `https://vmm-onboarding.netlify.app` (or your actual URL)
   - Redirect URL: `https://vmm-onboarding.netlify.app/auth/callback`
