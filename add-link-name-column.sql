-- =====================================================
-- ADD MISSING link_name COLUMN TO onboarding_links TABLE
-- =====================================================
-- This script adds the missing link_name column to the existing onboarding_links table

-- Add the missing link_name column
ALTER TABLE onboarding_links 
ADD COLUMN link_name text;

-- Add an index for the new column (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_onboarding_links_link_name ON onboarding_links(link_name);

-- Verify the column was added
DO $$
BEGIN
  RAISE NOTICE '✅ link_name column added successfully!';
  RAISE NOTICE '✅ Index created for link_name column';
  RAISE NOTICE '✅ Link generation should now work!';
END $$;
