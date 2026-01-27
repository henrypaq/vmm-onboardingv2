# How to Check if Connections Were Saved

## Option 1: Use the Verify Endpoint

Visit this URL in your browser (replace `YOUR_PLATFORM` with `google`, `meta`, or `tiktok`):
```
https://vast-onboarding.netlify.app/api/admin/platform-connections/verify?platform=YOUR_PLATFORM
```

This will show you:
- Whether connections exist in the database
- How many connections were found
- The connection details

## Option 2: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. After connecting, you should see:
   - `✅ OAuth success detected for [platform]`
   - `🔄 Fetching platform connections...`
   - `✅ Fetched connections: [...]`
   - `✅ Connection count: X`

## Option 3: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "platform-connections"
4. After connecting, check the response to `/api/admin/platform-connections`
5. Look for the `connections` array in the response

## Common Issues

### If connections exist but UI doesn't update:
- Check console for errors
- Verify the `useSearchParams` hook is working
- Try manually refreshing the page

### If connections don't exist:
- Check server logs for OAuth errors
- Verify the admin ID is being extracted correctly
- Check if upsert function is being called

## Debugging Steps

1. **Check if connection was saved:**
   ```
   Visit: /api/admin/platform-connections/verify?platform=google
   ```

2. **Check browser console:**
   - Look for OAuth success messages
   - Check for fetch errors
   - Verify URL params are being detected

3. **Check network requests:**
   - Verify `/api/admin/platform-connections` returns 200
   - Check the response contains your connections

4. **Manual refresh:**
   - If UI doesn't update, try refreshing the page
   - Connections should appear if they were saved
