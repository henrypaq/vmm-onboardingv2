-- =====================================================
-- COMPLETE DATABASE SETUP FOR VMM ONBOARDING PLATFORM
-- =====================================================
-- This script creates all necessary tables for OAuth flows,
-- user management, and link generation functionality.
-- Copy and paste this entire script into Supabase SQL Editor.

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
-- 2. ADMIN ACCOUNTS TABLE (OAuth Connections)
-- =====================================================
-- Stores OAuth tokens and account info for admin platform connections
CREATE TABLE IF NOT EXISTS admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'meta', 'tiktok', 'shopify')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text[] DEFAULT '{}', -- Array of granted scopes
  provider_user_id text, -- The user ID from the provider (e.g., Google user ID)
  provider_email text, -- Email from the provider
  provider_name text, -- Display name from the provider
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_id, provider) -- One account per provider per admin
);

-- =====================================================
-- 3. ADMIN PLATFORM CONNECTIONS TABLE
-- =====================================================
-- Alternative/additional table for storing platform connections
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
-- 4. CLIENTS TABLE
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
-- 5. ONBOARDING LINKS TABLE
-- =====================================================
-- Generated onboarding links with platform and permission specifications
CREATE TABLE IF NOT EXISTS onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platforms text[] NOT NULL DEFAULT '{}', -- Array of platform IDs
  requested_permissions jsonb DEFAULT '{}', -- JSON object mapping platform to permissions
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. ONBOARDING REQUESTS TABLE
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
-- 7. CLIENT PLATFORM CONNECTIONS TABLE
-- =====================================================
-- Stores OAuth connections made by clients during onboarding
CREATE TABLE IF NOT EXISTS client_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL, -- encrypted
  refresh_token text, -- encrypted
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Admin accounts indexes
CREATE INDEX IF NOT EXISTS idx_admin_accounts_admin_id ON admin_accounts(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_provider ON admin_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_expires_at ON admin_accounts(expires_at);

-- Admin platform connections indexes
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_admin_id ON admin_platform_connections(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_platform ON admin_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_active ON admin_platform_connections(is_active);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON clients(admin_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Onboarding links indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_links_admin_id ON onboarding_links(admin_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_token ON onboarding_links(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_expires_at ON onboarding_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_status ON onboarding_links(status);

-- Onboarding requests indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);

-- Client platform connections indexes
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_request_id ON client_platform_connections(request_id);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_platform ON client_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_active ON client_platform_connections(is_active);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_accounts_updated_at BEFORE UPDATE ON admin_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_platform_connections_updated_at BEFORE UPDATE ON admin_platform_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_links_updated_at BEFORE UPDATE ON onboarding_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_requests_updated_at BEFORE UPDATE ON onboarding_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_platform_connections_updated_at BEFORE UPDATE ON client_platform_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_platform_connections ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admin accounts policies
CREATE POLICY IF NOT EXISTS "Admins can view own accounts" ON admin_accounts
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert own accounts" ON admin_accounts
  FOR INSERT WITH CHECK (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update own accounts" ON admin_accounts
  FOR UPDATE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete own accounts" ON admin_accounts
  FOR DELETE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin platform connections policies
CREATE POLICY IF NOT EXISTS "Admins can view own platform connections" ON admin_platform_connections
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert own platform connections" ON admin_platform_connections
  FOR INSERT WITH CHECK (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update own platform connections" ON admin_platform_connections
  FOR UPDATE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete own platform connections" ON admin_platform_connections
  FOR DELETE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clients policies
CREATE POLICY IF NOT EXISTS "Admins can view own clients" ON clients
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert own clients" ON clients
  FOR INSERT WITH CHECK (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update own clients" ON clients
  FOR UPDATE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete own clients" ON clients
  FOR DELETE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Onboarding links policies
CREATE POLICY IF NOT EXISTS "Admins can view own links" ON onboarding_links
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert own links" ON onboarding_links
  FOR INSERT WITH CHECK (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update own links" ON onboarding_links
  FOR UPDATE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete own links" ON onboarding_links
  FOR DELETE USING (
    admin_id IN (
      SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public access for onboarding links (for client onboarding)
CREATE POLICY IF NOT EXISTS "Public can view valid onboarding links" ON onboarding_links
  FOR SELECT USING (
    status = 'pending' AND expires_at > now()
  );

-- Onboarding requests policies
CREATE POLICY IF NOT EXISTS "Admins can view requests for their links" ON onboarding_requests
  FOR SELECT USING (
    link_id IN (
      SELECT id FROM onboarding_links WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Anyone can insert onboarding requests" ON onboarding_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can update requests for their links" ON onboarding_requests
  FOR UPDATE USING (
    link_id IN (
      SELECT id FROM onboarding_links WHERE admin_id = auth.uid()
    )
  );

-- Client platform connections policies
CREATE POLICY IF NOT EXISTS "Anyone can view connections for public requests" ON client_platform_connections
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM onboarding_requests WHERE link_id IN (
        SELECT id FROM onboarding_links WHERE status = 'pending' AND expires_at > now()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Anyone can insert platform connections" ON client_platform_connections
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample admin user (you'll need to replace with actual user ID from Supabase Auth)
-- Note: This will only work if you have a user in auth.users table
-- INSERT INTO users (id, email, role, full_name, company_name) 
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'admin@example.com',
--   'admin',
--   'Admin User',
--   'Example Company'
-- ) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS
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
  provider_user_id text,
  provider_username text,
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
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '📊 Created 7 tables with proper relationships';
  RAISE NOTICE '🔒 Row Level Security policies applied';
  RAISE NOTICE '⚡ Performance indexes created';
  RAISE NOTICE '🔄 Auto-update triggers configured';
  RAISE NOTICE '🚀 Ready for OAuth flows and link generation!';
END $$;
