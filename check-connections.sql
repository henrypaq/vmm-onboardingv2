-- Check all client platform connections (without assets column for now)
SELECT 
  id,
  client_id,
  platform,
  platform_username,
  is_active,
  created_at,
  updated_at
FROM client_platform_connections
ORDER BY created_at DESC
LIMIT 20;

-- Check connections for a specific client (replace with actual client ID)
-- Example: SELECT * FROM client_platform_connections WHERE client_id = '359959cb-f86d-4ed2-8f35-6658fbf41200';

-- Count connections per client
SELECT 
  client_id,
  COUNT(*) as connection_count,
  array_agg(platform) as platforms
FROM client_platform_connections
WHERE is_active = true
GROUP BY client_id
ORDER BY connection_count DESC;
