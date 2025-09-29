-- Fix onboarding_requests table schema issues
-- This script addresses potential issues that could cause 500 errors

-- 1. Ensure link_id is NOT NULL and has proper foreign key
ALTER TABLE onboarding_requests 
  ALTER COLUMN link_id SET NOT NULL;

-- 2. Ensure the foreign key constraint exists and is properly set up
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='onboarding_requests' AND constraint_name='fk_onboarding_requests_link'
  ) THEN
    ALTER TABLE onboarding_requests DROP CONSTRAINT fk_onboarding_requests_link;
  END IF;
  
  -- Add the constraint back
  ALTER TABLE onboarding_requests
    ADD CONSTRAINT fk_onboarding_requests_link
    FOREIGN KEY (link_id) REFERENCES onboarding_links(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- 3. Ensure all required columns have proper defaults
ALTER TABLE onboarding_requests 
  ALTER COLUMN granted_permissions SET DEFAULT '{}',
  ALTER COLUMN platform_connections SET DEFAULT '{}',
  ALTER COLUMN status SET DEFAULT 'in_progress';

-- 4. Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);

-- 5. Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'onboarding_requests' 
ORDER BY ordinal_position;
