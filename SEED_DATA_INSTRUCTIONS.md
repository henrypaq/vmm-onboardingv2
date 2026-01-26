# Seed Data Instructions

## 📋 Overview

Since your previous Supabase project was paused and cannot be recovered, I've created a seed data script to help you populate your new database with useful test data for development.

## ⚠️ Important: Read This First

**The seed script requires you to have an admin user already created through Supabase Auth.**

Users in the `users` table must first exist in Supabase's `auth.users` table. This happens automatically when you:
1. Sign up through your app's `/signup` page, OR
2. Create a user manually in Supabase Dashboard → Authentication → Users

## 🚀 Quick Start

### Step 1: Create Your Admin User

**Option A: Through Your App (Recommended)**
1. Start your dev server: `npm run dev`
2. Go to: http://localhost:3000/signup
3. Create an admin account
4. Verify your email (check your inbox)
5. Note your user UUID (you'll need this)

**Option B: Through Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Copy the User UID (this is what you need)

### Step 2: Find Your User UUID

**Method 1: From Supabase Dashboard**
- Go to: Authentication → Users
- Click on your user
- Copy the "User UID" (looks like: `123e4567-e89b-12d3-a456-426614174000`)

**Method 2: From Database Query**
- Open Supabase SQL Editor
- Run: `SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';`
- Copy the `id` value

### Step 3: Update the Seed Script

1. Open `seed-sample-data.sql`
2. Find all instances of `'YOUR_ADMIN_USER_UUID_HERE'`
3. Replace them with your actual admin user UUID

**Example:**
```sql
-- Before:
admin_uuid uuid := 'YOUR_ADMIN_USER_UUID_HERE';

-- After:
admin_uuid uuid := '123e4567-e89b-12d3-a456-426614174000';
```

### Step 4: Create User Profile (if needed)

If you created the user through Supabase Dashboard (not through your app), you need to create the profile in the `users` table:

1. Open Supabase SQL Editor
2. Run this (replace with your actual values):

```sql
INSERT INTO users (id, email, role, full_name, company_name)
VALUES (
  'YOUR_ADMIN_USER_UUID_HERE',  -- Your actual UUID
  'your-email@example.com',     -- Your actual email
  'admin',
  'Your Name',
  'Your Company'
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  company_name = EXCLUDED.company_name;
```

### Step 5: Run the Seed Script

1. Open Supabase SQL Editor
2. Copy the entire contents of `seed-sample-data.sql`
3. Make sure you've replaced all `YOUR_ADMIN_USER_UUID_HERE` placeholders
4. Click "Run"

## 📊 What Gets Created

The seed script creates:

### ✅ Sample Clients (3)
- `client1@example.com` - Acme Corporation (active)
- `client2@example.com` - Tech Solutions Inc (active)
- `client3@example.com` - Digital Marketing Pro (inactive)

### ✅ Sample Onboarding Links (4)
1. **Active Link** (`demo-link-active-2024`)
   - Status: pending
   - Platforms: Meta, Google
   - Expires: 30 days from now

2. **Completed Link** (`demo-link-completed-2024`)
   - Status: completed
   - Platforms: Meta, TikTok
   - Already used

3. **Expired Link** (`demo-link-expired-2024`)
   - Status: expired
   - Platforms: Google
   - Expired 5 days ago

4. **In Progress Link** (`demo-link-in-progress-2024`)
   - Status: in_progress
   - Platforms: Shopify, Google
   - Expires: 7 days from now

### ✅ Sample Onboarding Request (1)
- Linked to the completed onboarding link
- Status: completed
- Includes sample OAuth connection data

## 🔍 Verify the Data

After running the script, verify the data with these queries:

```sql
-- Check your user profile
SELECT id, email, role, full_name, company_name FROM users;

-- Check clients
SELECT id, email, full_name, company_name, status FROM clients;

-- Check onboarding links
SELECT id, link_name, token, platforms, status, expires_at, is_used 
FROM onboarding_links 
ORDER BY created_at DESC;

-- Check onboarding requests
SELECT id, client_email, client_name, status, submitted_at 
FROM onboarding_requests;
```

## 🧪 Test the Data

### Test Onboarding Links

1. **Active Link:**
   - Visit: `http://localhost:3000/onboarding/demo-link-active-2024`
   - Should show the onboarding form

2. **Completed Link:**
   - Visit: `http://localhost:3000/onboarding/demo-link-completed-2024`
   - Should show as completed

3. **Expired Link:**
   - Visit: `http://localhost:3000/onboarding/demo-link-expired-2024`
   - Should show as expired

### Test Admin Dashboard

1. Login to your admin account
2. Go to `/admin/clients` - Should see 3 sample clients
3. Go to `/admin/links` - Should see 4 sample onboarding links

## 🛠️ Customizing the Seed Data

You can modify `seed-sample-data.sql` to:
- Add more clients
- Create different types of onboarding links
- Add more onboarding requests
- Change platform configurations
- Adjust expiration dates

## ⚠️ Important Notes

1. **User UUID is Required**: The script won't work without replacing the placeholder UUID
2. **User Must Exist First**: Create your admin user before running the seed script
3. **Safe to Re-run**: The script uses `ON CONFLICT DO NOTHING`, so it's safe to run multiple times
4. **Development Only**: This is test data - don't use in production without modification

## 🆘 Troubleshooting

### "Foreign key constraint violation"
- Make sure you've replaced `YOUR_ADMIN_USER_UUID_HERE` with your actual UUID
- Verify the user exists in `auth.users` table

### "No rows inserted"
- Check that your admin UUID is correct
- Verify the user profile exists in the `users` table
- Check for any error messages in the SQL Editor output

### "Permission denied" or RLS errors
- Make sure you're running the script as a user with proper permissions
- Check that RLS policies allow your user to insert data

## 📝 Next Steps

After seeding the data:
1. ✅ Test the admin dashboard
2. ✅ Test onboarding link generation
3. ✅ Test the onboarding flow
4. ✅ Create your own real clients and links
5. ✅ Remove test data when ready for production

---

**Need help?** Check the Supabase logs or verify your user UUID is correct.
