-- Clear all admin platform connections
-- This script removes all existing connections to start fresh

-- Option 1: Soft delete (set is_active to false)
UPDATE admin_platform_connections
SET is_active = false,
    updated_at = now()
WHERE is_active = true;

-- Option 2: Hard delete (completely remove records)
-- Uncomment the line below if you want to permanently delete instead of soft delete
-- DELETE FROM admin_platform_connections;

-- Verify the cleanup
SELECT 
    platform,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_count
FROM admin_platform_connections
GROUP BY platform
ORDER BY platform;
