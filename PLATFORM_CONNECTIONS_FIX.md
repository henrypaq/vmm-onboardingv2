# Platform Connections Authentication Fix

## Issues Fixed

### 1. Authentication Errors (401 Unauthorized)
**Problem:** API routes were returning 401 errors when fetching platform connections.

**Root Causes:**
- Client-side fetch requests weren't including cookies (`credentials: 'include'`)
- DELETE route was using a mock admin ID instead of the authenticated user ID

**Fixes Applied:**
- ✅ Added `credentials: 'include'` to all fetch requests in settings page
- ✅ Updated DELETE route to use `getCurrentUserId()` instead of mock ID
- ✅ Added authentication checks before allowing deletion
- ✅ Improved error handling with user-friendly toast messages

### 2. OAuth Flow Authentication
**Problem:** OAuth routes showing "not_authenticated" errors.

**Current Implementation:**
- ✅ OAuth routes check for session before initiating OAuth flow
- ✅ Admin ID is stored in OAuth `state` parameter
- ✅ Admin ID is extracted from state on callback
- ✅ Tokens are saved to database with correct `admin_id`

**OAuth Flow:**
1. User clicks "Connect" → Redirects to `/api/oauth/admin/connect/{platform}`
2. Route checks for authenticated session
3. If authenticated, stores `admin_id` in OAuth state parameter
4. Redirects to platform OAuth (Meta/Google/etc.)
5. Platform redirects back with authorization code
6. Route exchanges code for access token
7. Route extracts `admin_id` from state
8. Saves connection to `admin_platform_connections` table with `admin_id`
9. Redirects back to settings page with success

### 3. Token Storage
**Database Table:** `admin_platform_connections`
- ✅ `admin_id` - Links connection to authenticated user
- ✅ `platform` - Platform name (meta, google, tiktok, shopify)
- ✅ `access_token` - Encrypted access token
- ✅ `refresh_token` - Encrypted refresh token (if available)
- ✅ `token_expires_at` - Token expiration timestamp
- ✅ `scopes` - Array of granted permissions
- ✅ `is_active` - Connection status

## Files Modified

1. **`src/app/admin/settings/page.tsx`**
   - Added `credentials: 'include'` to fetch requests
   - Improved error handling with toast notifications
   - Better user feedback for authentication errors

2. **`src/app/api/admin/platform-connections/route.ts`**
   - Already using `getCurrentUserId()` correctly
   - Returns 401 if not authenticated

3. **`src/app/api/admin/platform-connections/[platform]/route.ts`**
   - Fixed: Replaced mock admin ID with real authenticated user ID
   - Added authentication check before deletion

4. **`src/lib/auth/get-current-user.ts`**
   - Added better logging for debugging
   - Improved error messages

5. **`src/lib/db/database.ts`**
   - Added logging to `deleteAdminPlatformConnectionByAdminAndPlatform`

## Testing Checklist

### Before Testing
- [ ] Ensure you are logged in as an admin user
- [ ] Verify session is active (check browser cookies for Supabase session)
- [ ] Check that environment variables are set:
  - `NEXT_PUBLIC_META_APP_ID`
  - `META_APP_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_APP_URL`

### Testing Steps

1. **Test Platform Connections Fetch**
   - Navigate to `/admin/settings`
   - Check browser console for any errors
   - Verify platform connections load (or show empty state if none)

2. **Test Meta Connection**
   - Click "Connect" on Meta platform
   - Should redirect to Facebook OAuth
   - Authorize the app
   - Should redirect back to settings with success
   - Connection should appear in the list

3. **Test Google Connection**
   - Click "Connect" on Google platform
   - Should redirect to Google OAuth
   - Authorize the app
   - Should redirect back to settings with success
   - Connection should appear in the list

4. **Test Disconnect**
   - Click trash icon on connected platform
   - Should show success message
   - Connection should disappear from list

5. **Verify Database**
   - Check `admin_platform_connections` table in Supabase
   - Verify `admin_id` matches your user ID
   - Verify tokens are stored (encrypted)
   - Verify `is_active` is `true`

## Troubleshooting

### If you still get 401 errors:

1. **Check if you're logged in:**
   - Open browser DevTools → Application → Cookies
   - Look for Supabase session cookies (usually `sb-*-auth-token`)
   - If missing, log out and log back in

2. **Check session expiration:**
   - Supabase sessions expire after a period of inactivity
   - Try logging out and logging back in

3. **Check environment variables:**
   - Verify all OAuth credentials are set in Netlify environment variables
   - For local development, check `.env.local`

4. **Check browser console:**
   - Look for CORS errors
   - Look for cookie-related errors
   - Check network tab to see if cookies are being sent

### If OAuth flow doesn't start:

1. **Check OAuth credentials:**
   - Verify `NEXT_PUBLIC_META_APP_ID` is set
   - Verify `GOOGLE_CLIENT_ID` is set
   - Check that redirect URIs are configured in OAuth provider dashboards

2. **Check redirect URIs:**
   - Meta: Should include `https://vast-onboarding.netlify.app/api/oauth/admin/connect/meta`
   - Google: Should include `https://vast-onboarding.netlify.app/api/oauth/admin/connect/google`

3. **Check session:**
   - OAuth routes require an active session
   - If session is missing, you'll be redirected back with `error=not_authenticated`

## OAuth Redirect URI Configuration

### Meta (Facebook)
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Settings → Basic
4. Add to "Valid OAuth Redirect URIs":
   ```
   https://vast-onboarding.netlify.app/api/oauth/admin/connect/meta
   ```

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Select your OAuth 2.0 Client ID
4. Add to "Authorized redirect URIs":
   ```
   https://vast-onboarding.netlify.app/api/oauth/admin/connect/google
   ```

## Security Notes

- ✅ All tokens are stored encrypted in the database
- ✅ Connections are scoped to the authenticated admin user
- ✅ Only the admin who created a connection can see/delete it
- ✅ OAuth state parameter prevents CSRF attacks
- ✅ Session validation prevents unauthorized access
