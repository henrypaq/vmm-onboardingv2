-- Fix missing is_used column in onboarding_links table
-- Run this in Supabase SQL Editor

-- Add the is_used column if it doesn't exist
ALTER TABLE onboarding_links 
ADD COLUMN IF NOT EXISTS is_used boolean DEFAULT false;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_onboarding_links_is_used ON onboarding_links(is_used);

-- Update any existing records to have is_used = false
UPDATE onboarding_links 
SET is_used = false 
WHERE is_used IS NULL;

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'onboarding_links' 
AND column_name = 'is_used';
