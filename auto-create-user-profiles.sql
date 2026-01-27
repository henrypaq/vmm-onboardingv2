-- =====================================================
-- AUTO-CREATE USER PROFILES TRIGGER
-- =====================================================
-- This trigger automatically creates a user profile in the users table
-- whenever a new user is created in auth.users
-- =====================================================

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')::text, -- Default to 'admin' if not specified
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')::text,
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')::text
  )
  ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- BACKFILL EXISTING USERS
-- =====================================================
-- This will create user profiles for any existing auth.users
-- that don't have a corresponding entry in the users table
-- =====================================================

INSERT INTO public.users (id, email, role, full_name, company_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'admin')::text,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '')::text,
  COALESCE(au.raw_user_meta_data->>'company_name', '')::text
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL -- Only insert if user doesn't exist in users table
ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check how many users were backfilled
DO $$
DECLARE
  backfilled_count INTEGER;
  total_auth_users INTEGER;
  total_profile_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth_users FROM auth.users;
  SELECT COUNT(*) INTO total_profile_users FROM public.users;
  backfilled_count := total_profile_users;
  
  RAISE NOTICE '✅ User profile auto-creation trigger installed!';
  RAISE NOTICE '📊 Total auth.users: %', total_auth_users;
  RAISE NOTICE '📊 Total users profiles: %', total_profile_users;
  RAISE NOTICE '✅ All existing users have been backfilled';
END $$;
