-- =====================================================
-- SEED SAMPLE DATA FOR VMM ONBOARDING PLATFORM
-- =====================================================
-- This script adds sample/test data to help you get started
-- Run this AFTER you've created at least one admin user through Supabase Auth
--
-- IMPORTANT: Before running this script:
-- 1. Create an admin user through your app's signup flow (or Supabase Auth)
-- 2. Note the user's UUID from Supabase Auth
-- 3. Replace the placeholder UUIDs below with your actual admin user UUID
--
-- =====================================================
-- STEP 1: UPDATE THE ADMIN USER UUID
-- =====================================================
-- Replace 'YOUR_ADMIN_USER_UUID_HERE' with your actual admin user UUID
-- You can find this in Supabase Dashboard → Authentication → Users
-- Or by checking auth.users table after signing up

-- Example: If your admin user UUID is '123e4567-e89b-12d3-a456-426614174000'
-- Replace all instances of 'YOUR_ADMIN_USER_UUID_HERE' with that UUID

-- =====================================================
-- STEP 2: CREATE USER PROFILE (if not already created)
-- =====================================================
-- This assumes you've already created a user through Supabase Auth
-- The users table extends auth.users, so the user must exist in auth.users first

-- Uncomment and update this if you need to create a user profile:
/*
INSERT INTO users (id, email, role, full_name, company_name)
VALUES (
  'YOUR_ADMIN_USER_UUID_HERE',  -- Replace with your actual UUID
  'admin@example.com',          -- Replace with your actual email
  'admin',
  'Admin User',
  'Your Company Name'
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  company_name = EXCLUDED.company_name;
*/

-- =====================================================
-- STEP 3: SAMPLE CLIENTS
-- =====================================================
-- Add sample clients for testing
-- Replace 'YOUR_ADMIN_USER_UUID_HERE' with your actual admin UUID

INSERT INTO clients (admin_id, email, full_name, company_name, status)
VALUES 
  (
    'YOUR_ADMIN_USER_UUID_HERE',  -- Replace with your actual admin UUID
    'client1@example.com',
    'John Smith',
    'Acme Corporation',
    'active'
  ),
  (
    'YOUR_ADMIN_USER_UUID_HERE',  -- Replace with your actual admin UUID
    'client2@example.com',
    'Sarah Johnson',
    'Tech Solutions Inc',
    'active'
  ),
  (
    'YOUR_ADMIN_USER_UUID_HERE',  -- Replace with your actual admin UUID
    'client3@example.com',
    'Mike Williams',
    'Digital Marketing Pro',
    'inactive'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: SAMPLE ONBOARDING LINKS
-- =====================================================
-- Create sample onboarding links with different statuses
-- Replace 'YOUR_ADMIN_USER_UUID_HERE' with your actual admin UUID

-- Get a client ID for linking (optional)
DO $$
DECLARE
  admin_uuid uuid := 'YOUR_ADMIN_USER_UUID_HERE';  -- Replace with your actual admin UUID
  client1_id uuid;
  client2_id uuid;
BEGIN
  -- Get first client ID
  SELECT id INTO client1_id FROM clients WHERE admin_id = admin_uuid LIMIT 1;
  SELECT id INTO client2_id FROM clients WHERE admin_id = admin_uuid OFFSET 1 LIMIT 1;

  -- Active onboarding link (pending)
  INSERT INTO onboarding_links (
    admin_id,
    client_id,
    link_name,
    token,
    platforms,
    requested_permissions,
    expires_at,
    status,
    is_used
  )
  VALUES (
    admin_uuid,
    client1_id,
    'Q1 2024 Marketing Campaign',
    'demo-link-active-2024',
    ARRAY['meta', 'google'],
    '{"meta": ["pages_read_engagement", "pages_manage_posts"], "google": ["analytics.readonly", "ads.readonly"]}'::jsonb,
    NOW() + INTERVAL '30 days',
    'pending',
    false
  )
  ON CONFLICT (token) DO NOTHING;

  -- Completed onboarding link
  INSERT INTO onboarding_links (
    admin_id,
    client_id,
    link_name,
    token,
    platforms,
    requested_permissions,
    expires_at,
    status,
    is_used
  )
  VALUES (
    admin_uuid,
    client2_id,
    'Social Media Integration',
    'demo-link-completed-2024',
    ARRAY['meta', 'tiktok'],
    '{"meta": ["pages_read_engagement"], "tiktok": ["user.info.basic"]}'::jsonb,
    NOW() + INTERVAL '15 days',
    'completed',
    true
  )
  ON CONFLICT (token) DO NOTHING;

  -- Expired onboarding link
  INSERT INTO onboarding_links (
    admin_id,
    client_id,
    link_name,
    token,
    platforms,
    requested_permissions,
    expires_at,
    status,
    is_used
  )
  VALUES (
    admin_uuid,
    NULL,
    'Expired Test Link',
    'demo-link-expired-2024',
    ARRAY['google'],
    '{"google": ["analytics.readonly"]}'::jsonb,
    NOW() - INTERVAL '5 days',
    'expired',
    false
  )
  ON CONFLICT (token) DO NOTHING;

  -- In progress onboarding link
  INSERT INTO onboarding_links (
    admin_id,
    client_id,
    link_name,
    token,
    platforms,
    requested_permissions,
    expires_at,
    status,
    is_used
  )
  VALUES (
    admin_uuid,
    NULL,
    'E-commerce Platform Setup',
    'demo-link-in-progress-2024',
    ARRAY['shopify', 'google'],
    '{"shopify": ["read_products", "read_orders"], "google": ["analytics.readonly"]}'::jsonb,
    NOW() + INTERVAL '7 days',
    'in_progress',
    false
  )
  ON CONFLICT (token) DO NOTHING;

END $$;

-- =====================================================
-- STEP 5: SAMPLE ONBOARDING REQUESTS
-- =====================================================
-- Create sample onboarding requests linked to the links above
-- Replace 'YOUR_ADMIN_USER_UUID_HERE' with your actual admin UUID

DO $$
DECLARE
  admin_uuid uuid := 'YOUR_ADMIN_USER_UUID_HERE';  -- Replace with your actual admin UUID
  completed_link_id uuid;
  client1_id uuid;
  client2_id uuid;
BEGIN
  -- Get the completed link ID
  SELECT id INTO completed_link_id 
  FROM onboarding_links 
  WHERE admin_id = admin_uuid AND token = 'demo-link-completed-2024' 
  LIMIT 1;

  -- Get client IDs
  SELECT id INTO client1_id FROM clients WHERE admin_id = admin_uuid LIMIT 1;
  SELECT id INTO client2_id FROM clients WHERE admin_id = admin_uuid OFFSET 1 LIMIT 1;

  -- Only create request if we have a link
  IF completed_link_id IS NOT NULL THEN
    -- Completed onboarding request
    INSERT INTO onboarding_requests (
      link_id,
      client_id,
      client_email,
      client_name,
      company_name,
      granted_permissions,
      platform_connections,
      status,
      submitted_at
    )
    VALUES (
      completed_link_id,
      client2_id,
      'client2@example.com',
      'Sarah Johnson',
      'Tech Solutions Inc',
      '{"meta": ["pages_read_engagement"], "tiktok": ["user.info.basic"]}'::jsonb,
      '{"meta": {"access_token": "sample_token_meta", "user_id": "123456"}, "tiktok": {"access_token": "sample_token_tiktok", "user_id": "789012"}}'::jsonb,
      'completed',
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the data was inserted correctly

-- Check users
-- SELECT id, email, role, full_name, company_name FROM users;

-- Check clients
-- SELECT id, email, full_name, company_name, status FROM clients WHERE admin_id = 'YOUR_ADMIN_USER_UUID_HERE';

-- Check onboarding links
-- SELECT id, link_name, token, platforms, status, expires_at, is_used FROM onboarding_links WHERE admin_id = 'YOUR_ADMIN_USER_UUID_HERE';

-- Check onboarding requests
-- SELECT id, client_email, client_name, status, submitted_at FROM onboarding_requests;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sample data seed script completed!';
  RAISE NOTICE '📝 Remember to replace YOUR_ADMIN_USER_UUID_HERE with your actual admin user UUID';
  RAISE NOTICE '📊 Sample data includes:';
  RAISE NOTICE '   - 3 sample clients';
  RAISE NOTICE '   - 4 sample onboarding links (pending, completed, expired, in_progress)';
  RAISE NOTICE '   - 1 sample onboarding request';
  RAISE NOTICE '🔍 Run the verification queries above to check the data';
END $$;
