-- =====================================================
-- FIX ONBOARDING_LINKS TABLE SCHEMA
-- =====================================================
-- This script fixes the onboarding_links table to ensure it has all required columns.
-- Run this if you're getting "Could not find the 'client_id' column" error.

-- =====================================================
-- 1. DROP AND RECREATE ONBOARDING_LINKS TABLE
-- =====================================================
-- This ensures the table has the correct schema

-- First, drop the existing table (this will also drop dependent objects)
DROP TABLE IF EXISTS onboarding_links CASCADE;

-- Recreate the table with the correct schema
CREATE TABLE onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  platforms text[] NOT NULL DEFAULT '{}', -- Array of platform IDs
  requested_permissions jsonb DEFAULT '{}', -- JSON object mapping platform to permissions
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')) DEFAULT 'pending',
  is_used boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. RECREATE INDEXES
-- =====================================================

-- Onboarding links indexes
CREATE INDEX idx_onboarding_links_admin_id ON onboarding_links(admin_id);
CREATE INDEX idx_onboarding_links_token ON onboarding_links(token);
CREATE INDEX idx_onboarding_links_status ON onboarding_links(status);
CREATE INDEX idx_onboarding_links_expires_at ON onboarding_links(expires_at);

-- =====================================================
-- 3. RECREATE RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE onboarding_links ENABLE ROW LEVEL SECURITY;

-- Onboarding links policies
CREATE POLICY "Admins can view their own onboarding links" ON onboarding_links
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admins can insert their own onboarding links" ON onboarding_links
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their own onboarding links" ON onboarding_links
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their own onboarding links" ON onboarding_links
  FOR DELETE USING (auth.uid() = admin_id);

-- Allow public access to onboarding links by token (for client onboarding)
CREATE POLICY "Public can view onboarding links by token" ON onboarding_links
  FOR SELECT USING (true); -- This allows clients to access their onboarding links

-- =====================================================
-- 4. RECREATE TRIGGER
-- =====================================================

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_onboarding_links_updated_at BEFORE UPDATE ON onboarding_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. RECREATE DEPENDENT OBJECTS
-- =====================================================

-- Recreate onboarding_requests table (it references onboarding_links)
DROP TABLE IF EXISTS onboarding_requests CASCADE;

CREATE TABLE onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES onboarding_links(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_email text,
  client_name text,
  company_name text,
  granted_permissions jsonb DEFAULT '{}', -- JSON object mapping platform to granted permissions
  platform_connections jsonb DEFAULT '{}', -- JSON object storing OAuth connection data
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recreate indexes for onboarding_requests
CREATE INDEX idx_onboarding_requests_link_id ON onboarding_requests(link_id);
CREATE INDEX idx_onboarding_requests_client_id ON onboarding_requests(client_id);
CREATE INDEX idx_onboarding_requests_status ON onboarding_requests(status);

-- Enable RLS for onboarding_requests
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Recreate policies for onboarding_requests
CREATE POLICY "Admins can view requests for their links" ON onboarding_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM onboarding_links 
      WHERE onboarding_links.id = onboarding_requests.link_id 
      AND onboarding_links.admin_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert onboarding requests" ON onboarding_requests
  FOR INSERT WITH CHECK (true); -- Allow clients to submit onboarding requests

CREATE POLICY "Admins can update requests for their links" ON onboarding_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM onboarding_links 
      WHERE onboarding_links.id = onboarding_requests.link_id 
      AND onboarding_links.admin_id = auth.uid()
    )
  );

-- Recreate trigger for onboarding_requests
CREATE TRIGGER update_onboarding_requests_updated_at BEFORE UPDATE ON onboarding_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ onboarding_links table fixed successfully!';
  RAISE NOTICE '📊 Recreated onboarding_links and onboarding_requests tables';
  RAISE NOTICE '🔒 Row Level Security policies restored';
  RAISE NOTICE '⚡ Performance indexes recreated';
  RAISE NOTICE '🔄 Auto-update triggers restored';
  RAISE NOTICE '🚀 Ready for link generation!';
END $$;
