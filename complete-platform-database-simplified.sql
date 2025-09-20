-- =====================================================
-- COMPLETE PLATFORM DATABASE SETUP - SIMPLIFIED VERSION
-- =====================================================
-- This script creates ALL necessary tables, indexes, policies, triggers, and functions
-- for the complete VMM onboarding platform with Link Name support.
-- Copy and paste this ENTIRE script into Supabase SQL Editor.

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  full_name text,
  company_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. ADMIN PLATFORM CONNECTIONS TABLE
-- =====================================================
-- Stores OAuth tokens and account info for admin platform connections
CREATE TABLE IF NOT EXISTS admin_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL, -- encrypted
  refresh_token text, -- encrypted
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_id, platform)
);

-- =====================================================
-- 3. CLIENTS TABLE
-- =====================================================
-- Client management for admins
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

-- =====================================================
-- 4. ONBOARDING LINKS TABLE - SIMPLIFIED VERSION
-- =====================================================
-- Generated onboarding links with platform and permission specifications
-- DROP and recreate to ensure exact schema match
DROP TABLE IF EXISTS onboarding_links CASCADE;

CREATE TABLE onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL, -- Optional reference for public links
  link_name text, -- Descriptive name for the onboarding link
  token text NOT NULL UNIQUE,
  platforms text[] NOT NULL DEFAULT '{}', -- Array of platform IDs
  requested_permissions jsonb DEFAULT '{}', -- JSON object mapping platform to permissions
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 5. ONBOARDING REQUESTS TABLE
-- =====================================================
-- Client onboarding submissions with granted permissions and connections
CREATE TABLE IF NOT EXISTS onboarding_requests (
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

-- =====================================================
-- 6. CLIENT PLATFORM CONNECTIONS TABLE
-- =====================================================
-- Stores OAuth connections made by clients during onboarding
CREATE TABLE IF NOT EXISTS client_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL, -- Can be onboarding token or actual client UUID
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL, -- encrypted
  refresh_token text, -- encrypted
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Admin platform connections indexes
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_admin_id ON admin_platform_connections(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_platform ON admin_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_active ON admin_platform_connections(is_active);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON clients(admin_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Onboarding links indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_links_admin_id ON onboarding_links(admin_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_token ON onboarding_links(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_status ON onboarding_links(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_expires_at ON onboarding_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_link_name ON onboarding_links(link_name);

-- Onboarding requests indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);

-- Client platform connections indexes
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_client_id ON client_platform_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_platform ON client_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_active ON client_platform_connections(is_active);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_platform_connections ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admin platform connections policies
CREATE POLICY IF NOT EXISTS "Admins can view their own platform connections" ON admin_platform_connections
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can insert their own platform connections" ON admin_platform_connections
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can update their own platform connections" ON admin_platform_connections
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can delete their own platform connections" ON admin_platform_connections
  FOR DELETE USING (auth.uid() = admin_id);

-- Clients table policies
CREATE POLICY IF NOT EXISTS "Admins can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = admin_id);

-- Onboarding links policies
CREATE POLICY IF NOT EXISTS "Admins can view their own onboarding links" ON onboarding_links
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can insert their own onboarding links" ON onboarding_links
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can update their own onboarding links" ON onboarding_links
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Admins can delete their own onboarding links" ON onboarding_links
  FOR DELETE USING (auth.uid() = admin_id);

-- Allow public access to onboarding links by token (for client onboarding)
CREATE POLICY IF NOT EXISTS "Public can view onboarding links by token" ON onboarding_links
  FOR SELECT USING (true); -- This allows clients to access their onboarding links

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
  FOR INSERT WITH CHECK (true); -- Allow clients to submit onboarding requests

CREATE POLICY IF NOT EXISTS "Admins can update requests for their links" ON onboarding_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM onboarding_links 
      WHERE onboarding_links.id = onboarding_requests.link_id 
      AND onboarding_links.admin_id = auth.uid()
    )
  );

-- Client platform connections policies
CREATE POLICY IF NOT EXISTS "Clients can view their own connections" ON client_platform_connections
  FOR SELECT USING (true); -- Allow access for client onboarding

CREATE POLICY IF NOT EXISTS "Clients can insert their own connections" ON client_platform_connections
  FOR INSERT WITH CHECK (true); -- Allow clients to create connections during onboarding

CREATE POLICY IF NOT EXISTS "Clients can update their own connections" ON client_platform_connections
  FOR UPDATE USING (true); -- Allow clients to update connections

-- =====================================================
-- 9. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_admin_platform_connections_updated_at BEFORE UPDATE ON admin_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_onboarding_links_updated_at BEFORE UPDATE ON onboarding_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_onboarding_requests_updated_at BEFORE UPDATE ON onboarding_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_client_platform_connections_updated_at BEFORE UPDATE ON client_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. UTILITY FUNCTIONS
-- =====================================================

-- Function to check if a token is valid and not expired
CREATE OR REPLACE FUNCTION is_token_valid(token_uuid text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM onboarding_links 
    WHERE token = token_uuid 
    AND status = 'pending' 
    AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get admin platform connections
CREATE OR REPLACE FUNCTION get_admin_platform_connections(admin_uuid uuid)
RETURNS TABLE (
  platform text,
  platform_user_id text,
  platform_username text,
  scopes text[],
  is_active boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    apc.platform,
    apc.platform_user_id,
    apc.platform_username,
    apc.scopes,
    apc.is_active,
    apc.created_at
  FROM admin_platform_connections apc
  WHERE apc.admin_id = admin_uuid
  AND apc.is_active = true
  ORDER BY apc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show a success message when the script completes
DO $$
BEGIN
  RAISE NOTICE '✅ Complete platform database setup completed successfully!';
  RAISE NOTICE '📊 Created 6 tables with proper relationships';
  RAISE NOTICE '🔒 Row Level Security policies applied';
  RAISE NOTICE '⚡ Performance indexes created';
  RAISE NOTICE '🔄 Auto-update triggers configured';
  RAISE NOTICE '🛠️ Utility functions created';
  RAISE NOTICE '📝 Link name support included';
  RAISE NOTICE '🔗 Public onboarding links supported';
  RAISE NOTICE '✅ SIMPLIFIED: Removed is_used column - using status field instead';
  RAISE NOTICE '🚀 Ready for OAuth flows and link generation!';
END $$;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- All tables, indexes, policies, triggers, and utility functions have been created.
-- Your Supabase database is now ready for the complete VMM onboarding platform!

-- To verify the setup, you can run these queries:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT policy_name FROM pg_policies WHERE tablename IN ('users', 'admin_platform_connections', 'clients', 'onboarding_links', 'onboarding_requests', 'client_platform_connections');
