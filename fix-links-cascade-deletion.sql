-- Fix: Change ON DELETE CASCADE to RESTRICT for onboarding_links
-- This prevents links from being automatically deleted when the admin user is deleted
-- Links should only be deleted explicitly by the user

-- First, drop the existing foreign key constraint
ALTER TABLE onboarding_links
DROP CONSTRAINT IF EXISTS onboarding_links_admin_id_fkey;

-- Re-add the foreign key constraint with RESTRICT instead of CASCADE
ALTER TABLE onboarding_links
ADD CONSTRAINT onboarding_links_admin_id_fkey
FOREIGN KEY (admin_id)
REFERENCES users(id)
ON DELETE RESTRICT;

-- Verify the constraint was updated
DO $$
BEGIN
  RAISE NOTICE '✅ Updated onboarding_links.admin_id foreign key to ON DELETE RESTRICT';
  RAISE NOTICE '✅ Links will no longer be automatically deleted when admin users are deleted';
  RAISE NOTICE '✅ Links can now only be deleted explicitly by the user';
END $$;
