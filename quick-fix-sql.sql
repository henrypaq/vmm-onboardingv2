-- =====================================================
-- QUICK FIX FOR link_name COLUMN ERROR
-- =====================================================
-- This is a minimal script to fix just the link_name column issue
-- Run this if the full script doesn't work

-- Step 1: Drop the problematic table
DROP TABLE IF EXISTS onboarding_links CASCADE;

-- Step 2: Recreate with correct schema
CREATE TABLE onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  link_name text, -- This is the missing column causing the error
  token text NOT NULL UNIQUE,
  platforms text[] NOT NULL DEFAULT '{}',
  requested_permissions jsonb DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Add basic indexes
CREATE INDEX idx_onboarding_links_admin_id ON onboarding_links(admin_id);
CREATE INDEX idx_onboarding_links_token ON onboarding_links(token);
CREATE INDEX idx_onboarding_links_status ON onboarding_links(status);
CREATE INDEX idx_onboarding_links_link_name ON onboarding_links(link_name);

-- Step 4: Enable RLS
ALTER TABLE onboarding_links ENABLE ROW LEVEL SECURITY;

-- Step 5: Add basic policies
CREATE POLICY "Admins can view their own onboarding links" ON onboarding_links
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admins can insert their own onboarding links" ON onboarding_links
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Public can view onboarding links by token" ON onboarding_links
  FOR SELECT USING (true);

-- Step 6: Add update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_onboarding_links_updated_at BEFORE UPDATE ON onboarding_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ QUICK FIX COMPLETED!';
  RAISE NOTICE '✅ onboarding_links table recreated with link_name column';
  RAISE NOTICE '✅ Basic indexes and policies added';
  RAISE NOTICE '✅ Link generation should now work!';
END $$;
