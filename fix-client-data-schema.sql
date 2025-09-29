-- Fix client data persistence schema
-- Run this in Supabase SQL editor to ensure all required fields exist

-- Ensure clients table has all required fields
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS last_onboarding_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Ensure onboarding_requests table has all required fields
ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS link_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS platform_connections jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS granted_permissions jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- link_id → onboarding_links.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='onboarding_requests' AND constraint_name='fk_onboarding_requests_link'
  ) THEN
    ALTER TABLE onboarding_requests
      ADD CONSTRAINT fk_onboarding_requests_link
      FOREIGN KEY (link_id) REFERENCES onboarding_links(id) ON DELETE CASCADE;
  END IF;

  -- client_id → clients.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='onboarding_requests' AND constraint_name='fk_onboarding_requests_client'
  ) THEN
    ALTER TABLE onboarding_requests
      ADD CONSTRAINT fk_onboarding_requests_client
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_clients_admin ON clients(admin_id);
CREATE INDEX IF NOT EXISTS idx_clients_email_admin ON clients(admin_id, email);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link ON onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client ON onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);

-- Add updated_at triggers
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
END $$;

-- Verify the schema
SELECT 
  'clients' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

SELECT 
  'onboarding_requests' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'onboarding_requests' 
ORDER BY ordinal_position;
