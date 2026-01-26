# SQL Fix & Netlify Environment Variables

## ✅ SQL Script Fixed

The SQL migration failed because PostgreSQL doesn't support `IF NOT EXISTS` for `CREATE POLICY` statements. 

**Fix Applied:**
- Replaced all `CREATE POLICY IF NOT EXISTS` with `DROP POLICY IF EXISTS` followed by `CREATE POLICY`
- This makes the script idempotent (can be run multiple times safely)

**File Updated:** `complete-database-definitive-updated.sql`

You can now run the entire SQL script in Supabase SQL Editor without errors.

---

## 🌐 Netlify Environment Variable

### Required Variable: `NEXT_PUBLIC_APP_URL`

This variable is used throughout your application for:
- OAuth redirect URIs (Google, Meta, TikTok)
- Email verification links
- Onboarding link generation
- API endpoint construction

### How to Set in Netlify

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Go to **Site settings** → **Environment variables**

2. **Add/Update the Variable**
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** Your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
   - **Scopes:** Select "All scopes" or specific scopes as needed

3. **Example Value**
   ```
   https://vast-onboarding.netlify.app
   ```
   (Replace with your actual Netlify site URL)

### Complete Netlify Environment Variables Checklist

Make sure you have all these variables set in Netlify:

#### Supabase (Required)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your new Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your new Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your new Supabase service role key

#### App Configuration (Required)
- ✅ `NEXT_PUBLIC_APP_URL` - Your Netlify site URL (e.g., `https://your-site.netlify.app`)

#### OAuth Credentials (Required for OAuth features)
- ✅ `NEXT_PUBLIC_META_APP_ID` - Meta/Facebook App ID
- ✅ `META_APP_SECRET` - Meta/Facebook App Secret
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret

### Important Notes

1. **No Trailing Slash**
   - ✅ Correct: `https://vast-onboarding.netlify.app`
   - ❌ Wrong: `https://vast-onboarding.netlify.app/`

2. **Use HTTPS**
   - Always use `https://` not `http://`

3. **Redeploy After Changes**
   - After updating environment variables, trigger a new deployment
   - Or push a commit to trigger auto-deploy

4. **OAuth Redirect URIs**
   After setting `NEXT_PUBLIC_APP_URL`, make sure your OAuth apps have the correct redirect URIs:

   **Google OAuth Console:**
   ```
   https://your-site.netlify.app/api/oauth/admin/connect/google
   https://your-site.netlify.app/api/oauth/client/connect/google
   ```

   **Meta App Settings:**
   ```
   https://your-site.netlify.app/api/oauth/admin/connect/meta
   https://your-site.netlify.app/api/oauth/client/connect/meta
   ```

---

## 🚀 Next Steps

1. ✅ **Run the Fixed SQL Script**
   - Copy `complete-database-definitive-updated.sql`
   - Paste into Supabase SQL Editor
   - Click "Run"

2. ✅ **Set Netlify Environment Variables**
   - Add `NEXT_PUBLIC_APP_URL` with your Netlify URL
   - Update Supabase credentials if needed

3. ✅ **Update OAuth Redirect URIs**
   - Update Google OAuth console
   - Update Meta app settings

4. ✅ **Redeploy**
   - Trigger a new deployment in Netlify

5. ✅ **Test**
   - Test OAuth flows
   - Test link generation
   - Test email verification

---

## 🆘 Troubleshooting

### "Invalid redirect_uri" OAuth Errors
- Check `NEXT_PUBLIC_APP_URL` is set correctly in Netlify
- Verify OAuth apps have the correct redirect URIs
- Make sure there's no trailing slash in the URL

### OAuth Redirects to Wrong URL
- Verify `NEXT_PUBLIC_APP_URL` matches your actual Netlify site URL
- Check for typos in the environment variable

### Email Verification Links Don't Work
- Ensure `NEXT_PUBLIC_APP_URL` is set to your production URL
- Check Supabase email templates use the correct redirect URL

---

## 📝 Quick Reference

**Netlify Environment Variable:**
```
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

**Where it's used:**
- OAuth redirects (admin & client)
- Email verification links
- Onboarding link generation
- API endpoint construction
