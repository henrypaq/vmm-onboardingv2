-- Add assets column to client_platform_connections table
-- This will store the discovered assets (Ad Accounts, Analytics Properties, etc.) for each platform connection

ALTER TABLE client_platform_connections 
ADD COLUMN assets JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN client_platform_connections.assets IS 'Array of discovered platform assets (Ad Accounts, Analytics Properties, etc.) stored as JSONB';

-- Create an index on the assets column for better query performance
CREATE INDEX idx_client_platform_connections_assets ON client_platform_connections USING GIN (assets);
