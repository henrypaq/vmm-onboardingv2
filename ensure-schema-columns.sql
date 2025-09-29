-- Ensure all required columns exist in onboarding_requests table
-- Run this in Supabase SQL editor

-- Check current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'onboarding_requests' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE onboarding_requests 
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

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link ON onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client ON onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);

-- Verify the schema after changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'onboarding_requests' 
ORDER BY ordinal_position;
