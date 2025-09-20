-- =====================================================
-- UPDATED DATABASE SETUP WITH LINK NAME FIELD
-- =====================================================
-- This script updates the database schema to include a link_name field
-- and ensures client_id remains optional for public onboarding links.

-- =====================================================
-- 1. ADD LINK_NAME FIELD TO ONBOARDING_LINKS TABLE
-- =====================================================

-- Add link_name field to onboarding_links table
ALTER TABLE onboarding_links 
ADD COLUMN IF NOT EXISTS link_name text;

-- Add comment to explain the field
COMMENT ON COLUMN onboarding_links.link_name IS 'Descriptive name for the onboarding link (e.g., "Client Onboarding - Q1 2024")';

-- =====================================================
-- 2. ENSURE CLIENT_ID IS OPTIONAL
-- =====================================================

-- Ensure client_id can be NULL (it should already be, but let's be explicit)
ALTER TABLE onboarding_links 
ALTER COLUMN client_id DROP NOT NULL;

-- Add comment to explain the optional nature
COMMENT ON COLUMN onboarding_links.client_id IS 'Optional reference to client record. NULL for public onboarding links.';

-- =====================================================
-- 3. UPDATE INDEXES (OPTIONAL)
-- =====================================================

-- Add index for link_name if needed for searching
CREATE INDEX IF NOT EXISTS idx_onboarding_links_link_name ON onboarding_links(link_name);

-- =====================================================
-- 4. UPDATE RLS POLICIES (IF NEEDED)
-- =====================================================

-- The existing RLS policies should work fine with the new field
-- No changes needed to policies

-- =====================================================
-- 5. SAMPLE DATA UPDATE (OPTIONAL)
-- =====================================================

-- Update any existing records to have a default link name
UPDATE onboarding_links 
SET link_name = 'Generated Link - ' || to_char(created_at, 'YYYY-MM-DD')
WHERE link_name IS NULL;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database updated successfully!';
  RAISE NOTICE '📝 Added link_name field to onboarding_links table';
  RAISE NOTICE '🔗 client_id remains optional for public links';
  RAISE NOTICE '⚡ Added index for link_name searching';
  RAISE NOTICE '🚀 Ready for link name-based onboarding!';
END $$;
