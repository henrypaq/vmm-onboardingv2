-- Direct fix for duplicate assets in onboarding_requests
-- This will remove duplicate ad accounts and ensure proper asset structure

-- First, let's see what we're working with
SELECT 
  id,
  client_email,
  platform_connections->'meta'->'assets' as meta_assets_before
FROM onboarding_requests 
WHERE platform_connections->'meta'->'assets' IS NOT NULL
  AND jsonb_array_length(platform_connections->'meta'->'assets') > 0;

-- Fix Meta platform connections - remove duplicate ad accounts
UPDATE onboarding_requests 
SET platform_connections = jsonb_set(
  platform_connections,
  ARRAY['meta', 'assets'],
  (
    WITH deduplicated AS (
      SELECT DISTINCT ON (asset->>'id', asset->>'type') asset
      FROM jsonb_array_elements(platform_connections->'meta'->'assets') AS asset
      ORDER BY asset->>'id', asset->>'type'
    )
    SELECT jsonb_agg(asset) FROM deduplicated
  )::jsonb
)
WHERE platform_connections->'meta'->'assets' IS NOT NULL
  AND jsonb_array_length(platform_connections->'meta'->'assets') > 0;

-- Show the results after fix
SELECT 
  id,
  client_email,
  platform_connections->'meta'->'assets' as meta_assets_after
FROM onboarding_requests 
WHERE platform_connections->'meta'->'assets' IS NOT NULL
  AND jsonb_array_length(platform_connections->'meta'->'assets') > 0;
