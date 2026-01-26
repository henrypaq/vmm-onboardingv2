# OAuth Redirect URI Configuration Guide

## 📍 Where to Configure Redirect URIs

You need to configure redirect URIs in each OAuth provider's developer dashboard. The redirect URIs must **exactly match** what your application uses.

## 🔗 Your Application's Redirect URIs

Based on your code, your application uses these redirect URIs:

### Production (Netlify)
- **Meta (Facebook):** `https://vast-onboarding.netlify.app/api/oauth/admin/connect/meta`
- **Google:** `https://vast-onboarding.netlify.app/api/oauth/admin/connect/google`
- **TikTok:** `https://vast-onboarding.netlify.app/api/oauth/admin/connect/tiktok`
- **Shopify:** `https://vast-onboarding.netlify.app/api/oauth/admin/connect/shopify`

### Local Development (Optional)
- **Meta:** `http://localhost:3000/api/oauth/admin/connect/meta`
- **Google:** `http://localhost:3000/api/oauth/admin/connect/google`
- **TikTok:** `http://localhost:3000/api/oauth/admin/connect/tiktok`
- **Shopify:** `http://localhost:3000/api/oauth/admin/connect/shopify`

---

## 📘 Meta (Facebook) Configuration

### Step-by-Step Instructions

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/apps/
   - Log in with your Facebook account

2. **Select Your App**
   - Click on your app (or create a new one if needed)
   - If creating new: App Type → "Business" → Fill in app details

3. **Navigate to Settings**
   - In the left sidebar, click **"Settings"** → **"Basic"**

4. **Add Redirect URI**
   - Scroll down to **"Valid OAuth Redirect URIs"**
   - Click **"Add Platform"** if the field is empty
   - Add this exact URI:
     ```
     https://vast-onboarding.netlify.app/api/oauth/admin/connect/meta
     ```
   - For local development, also add:
     ```
     http://localhost:3000/api/oauth/admin/connect/meta
     ```

5. **Save Changes**
   - Click **"Save Changes"** at the bottom

6. **Verify App ID and Secret**
   - Note your **App ID** (should match `NEXT_PUBLIC_META_APP_ID`)
   - Note your **App Secret** (should match `META_APP_SECRET`)
   - These are in the same "Basic" settings page

### Important Notes for Meta
- ✅ The redirect URI must **exactly match** (including `https://` and trailing path)
- ✅ No trailing slashes
- ✅ Must be HTTPS for production (HTTP only for localhost)
- ✅ Changes may take a few minutes to propagate

---

## 🔵 Google OAuth Configuration

### Step-by-Step Instructions

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Log in with your Google account

2. **Select or Create Project**
   - Use the project dropdown at the top
   - Select your project (or create a new one)

3. **Navigate to Credentials**
   - Go to **"APIs & Services"** → **"Credentials"** (in left sidebar)
   - Or use direct link: https://console.cloud.google.com/apis/credentials

4. **Select or Create OAuth Client**
   - If you have an OAuth 2.0 Client ID, click on it
   - If not, click **"Create Credentials"** → **"OAuth client ID"**
     - Application type: **"Web application"**
     - Name: e.g., "Vast Onboarding Platform"

5. **Add Authorized Redirect URIs**
   - In the **"Authorized redirect URIs"** section, click **"+ ADD URI"**
   - Add this exact URI:
     ```
     https://vast-onboarding.netlify.app/api/oauth/admin/connect/google
     ```
   - For local development, also add:
     ```
     http://localhost:3000/api/oauth/admin/connect/google
     ```

6. **Save**
   - Click **"Save"** or **"Create"**

7. **Note Your Credentials**
   - **Client ID** (should match `GOOGLE_CLIENT_ID`)
   - **Client Secret** (should match `GOOGLE_CLIENT_SECRET`)
   - These are shown after creating/editing the OAuth client

### Important Notes for Google
- ✅ Redirect URIs are case-sensitive
- ✅ Must include the full path (`/api/oauth/admin/connect/google`)
- ✅ HTTPS required for production
- ✅ Changes are immediate (no propagation delay)

---

## 🎵 TikTok Configuration (If Needed)

1. **Go to TikTok Developers**
   - Visit: https://developers.tiktok.com/
   - Log in and select your app

2. **Navigate to Basic Information**
   - Find **"Redirect URI"** or **"Callback URL"** section

3. **Add Redirect URI**
   ```
   https://vast-onboarding.netlify.app/api/oauth/admin/connect/tiktok
   ```

---

## 🛍️ Shopify Configuration (If Needed)

1. **Go to Shopify Partners**
   - Visit: https://partners.shopify.com/
   - Navigate to your app

2. **App Settings → URLs**
   - Add to **"Allowed redirection URL(s)"**:
   ```
   https://vast-onboarding.netlify.app/api/oauth/admin/connect/shopify
   ```

---

## ✅ Verification Checklist

After configuring, verify:

- [ ] **Meta:** Redirect URI added in Facebook Developers → Settings → Basic
- [ ] **Google:** Redirect URI added in Google Cloud Console → Credentials → OAuth Client
- [ ] **Environment Variables Set:**
  - [ ] `NEXT_PUBLIC_META_APP_ID` (in Netlify and `.env.local`)
  - [ ] `META_APP_SECRET` (in Netlify and `.env.local`)
  - [ ] `GOOGLE_CLIENT_ID` (in Netlify and `.env.local`)
  - [ ] `GOOGLE_CLIENT_SECRET` (in Netlify and `.env.local`)
  - [ ] `NEXT_PUBLIC_APP_URL` = `https://vast-onboarding.netlify.app` (in Netlify)

## 🧪 Testing

1. **Test Meta Connection:**
   - Go to `/admin/settings`
   - Click "Connect" on Meta
   - Should redirect to Facebook login
   - After authorizing, should redirect back to settings

2. **Test Google Connection:**
   - Go to `/admin/settings`
   - Click "Connect" on Google
   - Should redirect to Google login
   - After authorizing, should redirect back to settings

## 🐛 Common Issues

### "redirect_uri_mismatch" Error
- **Cause:** Redirect URI in OAuth provider doesn't match what your app sends
- **Fix:** Double-check the URI in the provider dashboard matches exactly (including `https://` and full path)

### "Invalid redirect URI"
- **Cause:** URI not added to authorized list
- **Fix:** Make sure you added the URI and saved changes

### OAuth Works Locally But Not in Production
- **Cause:** Production redirect URI not configured
- **Fix:** Add the production URI (with `https://vast-onboarding.netlify.app`) to the provider dashboard

## 📝 Quick Reference

**Your Production Redirect URIs:**
```
Meta:    https://vast-onboarding.netlify.app/api/oauth/admin/connect/meta
Google:  https://vast-onboarding.netlify.app/api/oauth/admin/connect/google
TikTok:  https://vast-onboarding.netlify.app/api/oauth/admin/connect/tiktok
Shopify: https://vast-onboarding.netlify.app/api/oauth/admin/connect/shopify
```

**Where to Configure:**
- **Meta:** https://developers.facebook.com/apps/ → Your App → Settings → Basic
- **Google:** https://console.cloud.google.com/apis/credentials → Your OAuth Client
- **TikTok:** https://developers.tiktok.com/ → Your App → Basic Information
- **Shopify:** https://partners.shopify.com/ → Your App → App Settings → URLs
