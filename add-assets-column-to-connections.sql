-- Add assets column to client_platform_connections table
-- This column stores JSONB array of platform assets (ad accounts, pages, etc.)

-- Check if column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'client_platform_connections' 
    AND column_name = 'assets'
  ) THEN
    ALTER TABLE client_platform_connections 
    ADD COLUMN assets jsonb DEFAULT '[]'::jsonb;
    
    RAISE NOTICE '✅ Added assets column to client_platform_connections table';
  ELSE
    RAISE NOTICE 'ℹ️ assets column already exists in client_platform_connections table';
  END IF;
  
  -- Create index on assets for better query performance (GIN index for JSONB)
  CREATE INDEX IF NOT EXISTS idx_client_platform_connections_assets 
  ON client_platform_connections USING GIN (assets);
  
  RAISE NOTICE '✅ Assets column migration complete!';
END $$;
