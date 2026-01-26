# User Account System Documentation

## 📋 Overview

The VMM Onboarding Platform uses **Supabase Auth** for user authentication with a custom `users` table that extends the auth system with role-based access control.

## 🔐 How It Works

### Authentication Flow

1. **User Signup** → Creates account in Supabase `auth.users`
2. **Profile Creation** → Creates corresponding record in `users` table
3. **Email Verification** → User verifies email (if required)
4. **Login** → Authenticates with Supabase Auth
5. **Session Management** → Supabase handles session cookies automatically

### Database Structure

```
auth.users (Supabase managed)
  └── id (UUID)
  └── email
  └── email_confirmed_at
  └── user_metadata

users (Custom table)
  └── id → References auth.users(id)
  └── email
  └── role ('admin' | 'client')
  └── full_name
  └── company_name
```

## 🚀 Creating a New Account

### Option 1: Through the Web Interface (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to signup page:**
   - Visit: `http://localhost:3000/signup`
   - Or click "Create one here" from the login page

3. **Fill out the form:**
   - Full Name
   - Company Name
   - Email Address
   - Password (minimum 6 characters)
   - Confirm Password

4. **Submit the form:**
   - Creates account in Supabase Auth
   - Creates profile in `users` table
   - Sends email verification code (if email confirmation is enabled)

5. **Verify your email:**
   - Check your email for verification code
   - Enter code on `/verify-email` page
   - Or click the verification link in email

6. **Login:**
   - Go to `/login` or home page `/`
   - Enter email and password
   - Redirected to `/admin` dashboard

### Option 2: Through Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. **Important:** You must also create the profile in `users` table:

```sql
INSERT INTO users (id, email, role, full_name, company_name)
VALUES (
  'USER_UUID_FROM_AUTH',  -- Copy from auth.users
  'user@example.com',
  'admin',
  'User Name',
  'Company Name'
);
```

## 🔑 Login Process

### How Login Works

1. User enters email and password
2. Frontend calls Supabase `signInWithPassword()`
3. Supabase validates credentials
4. Supabase sets session cookie automatically
5. User redirected to `/admin` dashboard

### Login Pages

- **Home Page (`/`)**: Has login form embedded
- **Login Page (`/login`)**: Dedicated login page
- Both use the same Supabase client authentication

## 👤 User Roles

Currently, the system supports two roles:

- **`admin`**: Full access to admin dashboard, client management, link generation
- **`client`**: Access to client dashboard (not yet fully implemented)

All signups through the web interface create `admin` accounts by default.

## 📧 Email Verification

### If Email Confirmation is Enabled

1. After signup, user receives email with verification code
2. User enters code on `/verify-email` page
3. Code is verified via Supabase `verifyOtp()`
4. User profile is created/updated in `users` table
5. User redirected to admin dashboard

### If Email Confirmation is Disabled

1. After signup, user can login immediately
2. User profile is created during signup
3. No verification step required

## 🛠️ Technical Details

### Signup API (`/api/auth/signup`)

- Uses Supabase `signUp()` method
- Creates user in `auth.users`
- Attempts to create profile in `users` table
- Returns success with email confirmation status

### Login API (`/api/auth/login`)

- Uses Supabase `signInWithPassword()`
- Fetches user profile from `users` table
- Returns user data and profile

**Note:** The login page uses direct Supabase client (not API) to properly set session cookies.

### User Profile Creation

User profiles are created in multiple places:
1. During signup (if successful)
2. During email verification (if not created during signup)
3. As fallback in client-side signup flow

## 🔒 Security Features

- **Password Requirements**: Minimum 6 characters (configurable in Supabase)
- **Email Verification**: Optional, configurable in Supabase Auth settings
- **Session Management**: Handled by Supabase (secure HTTP-only cookies)
- **Row Level Security**: Enabled on `users` table (users can only see their own profile)

## 🧪 Testing the System

### Test Signup Flow

1. Visit `/signup`
2. Fill out form with test data
3. Submit
4. Check email for verification code (if enabled)
5. Verify email
6. Login with credentials

### Test Login Flow

1. Visit `/login` or `/`
2. Enter email and password
3. Should redirect to `/admin`
4. Check browser console for any errors

### Verify User Creation

Run in Supabase SQL Editor:
```sql
-- Check auth user
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'your-email@example.com';

-- Check user profile
SELECT * FROM users WHERE email = 'your-email@example.com';
```

## 🆘 Troubleshooting

### "User already registered"
- User exists in `auth.users` but may not have profile
- Create profile manually or try login instead

### "Profile creation error"
- Auth user created but profile insert failed
- Check RLS policies
- Manually create profile in `users` table

### "Invalid login credentials"
- Check email and password are correct
- Verify email is confirmed (if email confirmation required)
- Check Supabase Auth logs for details

### "Session not persisting"
- Clear browser cookies
- Check Supabase URL and keys in `.env.local`
- Verify Supabase project is active

### Can't login after signup
- Check if email verification is required
- Verify email was confirmed
- Check `users` table has profile record

## 📝 Next Steps

After creating your account:
1. ✅ Login to admin dashboard
2. ✅ Generate onboarding links
3. ✅ Create clients
4. ✅ Test onboarding flow
5. ✅ Connect OAuth platforms (optional)

---

**Need help?** Check Supabase Dashboard → Authentication → Users to see all registered users.
