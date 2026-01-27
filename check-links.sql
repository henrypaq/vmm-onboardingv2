-- Check all onboarding links in the database
SELECT 
  id,
  admin_id,
  link_name,
  token,
  platforms,
  status,
  is_used,
  created_at
FROM onboarding_links
ORDER BY created_at DESC;

-- Check links for a specific admin (replace with your admin_id)
-- SELECT * FROM onboarding_links WHERE admin_id = 'your-admin-id-here';

-- Count links per admin
SELECT 
  admin_id,
  COUNT(*) as link_count,
  array_agg(link_name) as link_names
FROM onboarding_links
GROUP BY admin_id;
