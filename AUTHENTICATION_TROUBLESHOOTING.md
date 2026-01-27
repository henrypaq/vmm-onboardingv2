# Authentication Troubleshooting Guide

## Current Issue: 401 Unauthorized Errors

You're getting 401 errors when trying to:
- Fetch platform connections
- Connect to OAuth platforms

## Root Cause Analysis

The 401 error means the server cannot find your authentication session. This happens when:
1. Session cookies aren't being sent with requests
2. Session cookies aren't being read correctly by server
3. Session has expired
4. Cookies are set with wrong domain/path

## Immediate Steps to Fix

### Step 1: Verify You're Logged In

1. **Check Browser Cookies:**
   - Open DevTools (F12)
   - Go to **Application** → **Cookies**
   - Look for cookies starting with `sb-` (Supabase cookies)
   - Should see cookies like:
     - `sb-{project-ref}-auth-token`
     - `sb-{project-ref}-auth-token-code-verifier`

2. **Test Session Endpoint:**
   - Visit: `https://vast-onboarding.netlify.app/api/auth/check-session`
   - This will show you:
     - Whether cookies are present
     - Whether session is valid
     - User ID if authenticated

### Step 2: Re-login if Needed

If cookies are missing or session is invalid:

1. **Log out completely:**
   - Click user menu → Log out
   - Or clear browser cookies manually

2. **Log back in:**
   - Go to `/login`
   - Enter your credentials
   - This should set new session cookies

3. **Verify cookies are set:**
   - Check DevTools → Application → Cookies again
   - Should see Supabase auth cookies

### Step 3: Check Supabase Configuration

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Authentication → URL Configuration:**
   - **Site URL:** Should be `https://vast-onboarding.netlify.app`
   - **Redirect URLs:** Should include:
     ```
     https://vast-onboarding.netlify.app/**
     https://vast-onboarding.netlify.app/auth/callback
     ```

3. **Verify these match exactly:**
   - No trailing slashes
   - Correct protocol (https)
   - Correct domain

## What We've Fixed

### ✅ Middleware Session Refresh
- Middleware now refreshes Supabase sessions on each request
- Ensures cookies stay up to date

### ✅ Improved Session Reading
- Added `getUser()` fallback when `getSession()` fails
- Better error logging and debugging

### ✅ Client-Side Cookie Handling
- Using `createBrowserClient` from `@supabase/ssr`
- Proper cookie management for browser environment

### ✅ Fetch Requests
- Added `credentials: 'include'` to all fetch requests
- Ensures cookies are sent with API calls

## Testing Your Session

### Option 1: Use Diagnostic Endpoint
Visit: `https://vast-onboarding.netlify.app/api/auth/check-session`

This will return JSON showing:
```json
{
  "hasCookies": true,
  "cookieCount": 5,
  "supabaseCookieCount": 2,
  "hasSession": true,
  "sessionUserId": "your-user-id",
  "authenticated": true
}
```

### Option 2: Check Browser Console
1. Open DevTools → Console
2. After logging in, you should see:
   - `✅ Authenticated user ID: {your-id}` (from API routes)
   - No 401 errors

### Option 3: Check Network Tab
1. Open DevTools → Network
2. Try to connect a platform
3. Look for request to `/api/admin/platform-connections`
4. Check:
   - **Request Headers:** Should include `Cookie` header
   - **Response:** Should be 200, not 401

## Common Issues and Solutions

### Issue: "No session found" in logs
**Solution:**
- Log out and log back in
- Clear browser cache and cookies
- Try in incognito/private window

### Issue: Cookies not being sent
**Solution:**
- Verify `credentials: 'include'` is in fetch requests (already added)
- Check browser isn't blocking cookies
- Verify domain matches (no www vs non-www mismatch)

### Issue: Session expires immediately
**Solution:**
- Check Supabase session duration settings
- Verify cookies have correct expiration
- Middleware should refresh sessions automatically

### Issue: Works locally but not in production
**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` is set correctly in Netlify
- Check Supabase redirect URLs include production domain
- Verify cookies are set with correct domain

## Next Steps

1. **Test the diagnostic endpoint:**
   ```
   https://vast-onboarding.netlify.app/api/auth/check-session
   ```

2. **If still getting 401:**
   - Log out completely
   - Clear all cookies
   - Log back in
   - Try again

3. **Check server logs:**
   - Look for "Authenticated user ID" messages
   - Look for "No session found" messages
   - These will tell you if session is being read

4. **Verify Supabase configuration:**
   - Site URL matches your domain exactly
   - Redirect URLs are configured
   - No typos or mismatches

## Debug Information

The improved code now logs:
- Cookie names (for debugging)
- Whether Supabase auth cookies are present
- Session retrieval attempts
- User ID when authenticated
- Detailed error messages

Check your browser console and server logs for these messages to diagnose the issue.
