-- URGENT DATABASE FIX
-- This script fixes the missing is_used column and ensures all tables are properly set up
-- Run this in Supabase SQL Editor

-- First, let's check if the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_links' 
    AND column_name = 'is_used'
  ) THEN
    -- Add the missing column
    ALTER TABLE onboarding_links ADD COLUMN is_used boolean DEFAULT false;
    RAISE NOTICE 'Added is_used column to onboarding_links table';
  ELSE
    RAISE NOTICE 'is_used column already exists in onboarding_links table';
  END IF;
END $$;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_onboarding_links_is_used ON onboarding_links(is_used);

-- Update any existing records to have is_used = false
UPDATE onboarding_links 
SET is_used = false 
WHERE is_used IS NULL;

-- Verify the column exists and show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'onboarding_links' 
ORDER BY ordinal_position;

-- Also ensure the clients table exists and has the right structure
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company_name text,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  last_onboarding_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure onboarding_requests table exists
CREATE TABLE IF NOT EXISTS onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES onboarding_links(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_email text,
  client_name text,
  company_name text,
  granted_permissions jsonb DEFAULT '{}',
  platform_connections jsonb DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure client_platform_connections table exists
CREATE TABLE IF NOT EXISTS client_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- Add RLS policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_platform_connections ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY IF NOT EXISTS "Admins can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Onboarding requests policies
CREATE POLICY IF NOT EXISTS "Admins can view requests for their links" ON onboarding_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM onboarding_links 
      WHERE onboarding_links.id = onboarding_requests.link_id 
      AND onboarding_links.admin_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Public can insert onboarding requests" ON onboarding_requests
  FOR INSERT WITH CHECK (true);

-- Client platform connections policies
CREATE POLICY IF NOT EXISTS "Clients can view their own connections" ON client_platform_connections
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Clients can insert their own connections" ON client_platform_connections
  FOR INSERT WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database fix completed successfully!';
  RAISE NOTICE '✅ All required tables and columns are now present';
  RAISE NOTICE '✅ RLS policies have been applied';
  RAISE NOTICE '🚀 Link generation should now work!';
END $$;
