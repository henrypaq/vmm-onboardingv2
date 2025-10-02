-- Fix duplicate assets in existing onboarding_requests
-- This script will clean up duplicate ad accounts and ensure proper asset deduplication

-- Update Meta platform connections to remove duplicate ad accounts
UPDATE onboarding_requests 
SET platform_connections = jsonb_set(
  platform_connections,
  ARRAY['meta', 'assets'],
  (
    SELECT jsonb_agg(DISTINCT asset)
    FROM jsonb_array_elements(platform_connections->'meta'->'assets') AS asset
    WHERE asset->>'type' = 'ad_account'
    UNION
    SELECT jsonb_agg(DISTINCT asset)
    FROM jsonb_array_elements(platform_connections->'meta'->'assets') AS asset
    WHERE asset->>'type' != 'ad_account'
  )::jsonb
)
WHERE platform_connections->'meta'->'assets' IS NOT NULL
  AND jsonb_array_length(platform_connections->'meta'->'assets') > 0;

-- Also fix Google platform connections if they exist
UPDATE onboarding_requests 
SET platform_connections = jsonb_set(
  platform_connections,
  ARRAY['google', 'assets'],
  (
    SELECT jsonb_agg(DISTINCT asset)
    FROM jsonb_array_elements(platform_connections->'google'->'assets') AS asset
  )::jsonb
)
WHERE platform_connections->'google'->'assets' IS NOT NULL
  AND jsonb_array_length(platform_connections->'google'->'assets') > 0;

-- Show affected records
SELECT 
  id,
  client_email,
  platform_connections->'meta'->'assets' as meta_assets,
  platform_connections->'google'->'assets' as google_assets
FROM onboarding_requests 
WHERE platform_connections IS NOT NULL
  AND (
    platform_connections->'meta'->'assets' IS NOT NULL 
    OR platform_connections->'google'->'assets' IS NOT NULL
  );
