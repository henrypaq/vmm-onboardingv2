-- Verify and fix schema to match code exactly
-- Run this in Supabase SQL editor

-- First, check what tables and columns currently exist
SELECT 'Current Tables' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check clients table structure
SELECT 'clients table columns' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Check onboarding_requests table structure  
SELECT 'onboarding_requests table columns' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'onboarding_requests' 
ORDER BY ordinal_position;

-- Check onboarding_links table structure
SELECT 'onboarding_links table columns' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'onboarding_links' 
ORDER BY ordinal_position;

-- =====================================================
-- FIX CLIENTS TABLE
-- =====================================================

-- Ensure clients table has all required columns matching the code interface
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS admin_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_onboarding_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- =====================================================
-- FIX ONBOARDING_REQUESTS TABLE
-- =====================================================

-- Ensure onboarding_requests table has all required columns matching the code interface
ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS link_id uuid,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS granted_permissions jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS platform_connections jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- =====================================================
-- FIX ONBOARDING_LINKS TABLE
-- =====================================================

-- Ensure onboarding_links table has all required columns matching the code interface
ALTER TABLE onboarding_links
  ADD COLUMN IF NOT EXISTS admin_id uuid,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS link_name text,
  ADD COLUMN IF NOT EXISTS token text,
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requested_permissions jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

DO $$
BEGIN
  -- clients.admin_id → users.id (if users table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name='clients' AND constraint_name='fk_clients_admin'
    ) THEN
      ALTER TABLE clients
        ADD CONSTRAINT fk_clients_admin
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- onboarding_requests.link_id → onboarding_links.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='onboarding_requests' AND constraint_name='fk_onboarding_requests_link'
  ) THEN
    ALTER TABLE onboarding_requests
      ADD CONSTRAINT fk_onboarding_requests_link
      FOREIGN KEY (link_id) REFERENCES onboarding_links(id) ON DELETE CASCADE;
  END IF;

  -- onboarding_requests.client_id → clients.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='onboarding_requests' AND constraint_name='fk_onboarding_requests_client'
  ) THEN
    ALTER TABLE onboarding_requests
      ADD CONSTRAINT fk_onboarding_requests_client
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;

  -- onboarding_links.admin_id → users.id (if users table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name='onboarding_links' AND constraint_name='fk_onboarding_links_admin'
    ) THEN
      ALTER TABLE onboarding_links
        ADD CONSTRAINT fk_onboarding_links_admin
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- onboarding_links.client_id → clients.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='onboarding_links' AND constraint_name='fk_onboarding_links_client'
  ) THEN
    ALTER TABLE onboarding_links
      ADD CONSTRAINT fk_onboarding_links_client
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON clients(admin_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Onboarding links indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_links_admin_id ON onboarding_links(admin_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_token ON onboarding_links(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_status ON onboarding_links(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_expires_at ON onboarding_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_is_used ON onboarding_links(is_used);

-- Onboarding requests indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);

-- =====================================================
-- ADD UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_clients_updated_at') THEN
    CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_onboarding_requests_updated_at') THEN
    CREATE TRIGGER trg_onboarding_requests_updated_at BEFORE UPDATE ON onboarding_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_onboarding_links_updated_at') THEN
    CREATE TRIGGER trg_onboarding_links_updated_at BEFORE UPDATE ON onboarding_links
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- VERIFY FINAL SCHEMA
-- =====================================================

SELECT 'Final clients table structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

SELECT 'Final onboarding_requests table structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'onboarding_requests' 
ORDER BY ordinal_position;

SELECT 'Final onboarding_links table structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'onboarding_links' 
ORDER BY ordinal_position;
