-- Create two permanent onboarding links: Manage Link (disabled) and View Link (all platforms, all scopes)

-- Note: Replace '00000000-0000-0000-0000-000000000001' with the actual admin_id if different

-- Insert Manage Link (disabled/greyed out - will be marked as 'expired' status)
INSERT INTO onboarding_links (
  id,
  admin_id,
  link_name,
  token,
  platforms,
  requested_permissions,
  expires_at,
  status,
  is_used,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Manage Link (Coming Soon)',
  'manage-permanent-link',
  ARRAY['meta', 'google', 'tiktok', 'shopify'],
  jsonb_build_object(
    'meta', ARRAY[
      'pages_show_list',
      'pages_read_engagement',
      'pages_read_user_content',
      'instagram_basic',
      'instagram_manage_insights',
      'ads_management',
      'ads_read',
      'business_management',
      'read_insights',
      'pages_manage_ads',
      'pages_manage_metadata',
      'pages_manage_posts',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_messages'
    ],
    'google', ARRAY[
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    'tiktok', ARRAY[
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
      'video.insights'
    ],
    'shopify', ARRAY[
      'read_products',
      'read_orders',
      'read_customers',
      'read_analytics',
      'read_reports'
    ]
  ),
  (NOW() - INTERVAL '1 day')::timestamp, -- Expired date (yesterday)
  'expired',
  false,
  NOW(),
  NOW()
) ON CONFLICT (token) DO UPDATE SET
  link_name = EXCLUDED.link_name,
  platforms = EXCLUDED.platforms,
  requested_permissions = EXCLUDED.requested_permissions,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert View Link (active - all platforms, all scopes)
INSERT INTO onboarding_links (
  id,
  admin_id,
  link_name,
  token,
  platforms,
  requested_permissions,
  expires_at,
  status,
  is_used,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Universal Onboarding Link',
  'view-permanent-link',
  ARRAY['meta', 'google', 'tiktok', 'shopify'],
  jsonb_build_object(
    'meta', ARRAY[
      'pages_show_list',
      'pages_read_engagement',
      'pages_read_user_content',
      'instagram_basic',
      'instagram_manage_insights',
      'ads_management',
      'ads_read',
      'business_management',
      'read_insights',
      'pages_manage_ads',
      'pages_manage_metadata',
      'pages_manage_posts',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_messages'
    ],
    'google', ARRAY[
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    'tiktok', ARRAY[
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
      'video.insights'
    ],
    'shopify', ARRAY[
      'read_products',
      'read_orders',
      'read_customers',
      'read_analytics',
      'read_reports'
    ]
  ),
  (NOW() + INTERVAL '10 years')::timestamp, -- Far future expiration (effectively permanent)
  'pending',
  false,
  NOW(),
  NOW()
) ON CONFLICT (token) DO UPDATE SET
  link_name = EXCLUDED.link_name,
  platforms = EXCLUDED.platforms,
  requested_permissions = EXCLUDED.requested_permissions,
  expires_at = EXCLUDED.expires_at,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Verify the insertion
SELECT 
  id,
  link_name,
  token,
  platforms,
  status,
  expires_at,
  created_at
FROM onboarding_links
WHERE token IN ('manage-permanent-link', 'view-permanent-link')
ORDER BY token;

