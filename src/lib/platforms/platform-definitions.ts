export interface PlatformPermission {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: string;
}

export interface PlatformDefinition {
  id: string;
  name: string;
  icon: string;
  logo: string;
  color: string;
  permissions: PlatformPermission[];
  oauthScopes: string[];
}

export const PLATFORM_DEFINITIONS: Record<string, PlatformDefinition> = {
  meta: {
    id: 'meta',
    name: 'Meta (Facebook)',
    icon: 'Users',
    logo: '/logos/meta.png',
    color: 'bg-blue-600',
    oauthScopes: ['pages_read_engagement', 'pages_manage_posts', 'ads_read', 'pages_show_list'],
    permissions: [
      {
        id: 'pages_read_engagement',
        name: 'Read Page Engagement',
        description: 'Access to page posts, comments, and engagement metrics',
        required: true,
        category: 'Analytics',
      },
      {
        id: 'pages_manage_posts',
        name: 'Manage Page Posts',
        description: 'Create, edit, and delete posts on your pages',
        required: false,
        category: 'Content Management',
      },
      {
        id: 'ads_read',
        name: 'Read Ad Performance',
        description: 'View ad campaign performance and analytics',
        required: false,
        category: 'Advertising',
      },
      {
        id: 'pages_show_list',
        name: 'View Page List',
        description: 'See all pages you manage',
        required: true,
        category: 'Account Access',
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google',
    icon: 'Search',
    logo: '/logos/google.png',
    color: 'bg-red-600',
    // Minimal safe scopes for now; expand after Google verification
    oauthScopes: ['openid', 'email', 'profile'],
    permissions: [
      {
        id: 'analytics_read',
        name: 'Google Analytics Access',
        description: 'Read website traffic and user behavior data',
        required: true,
        category: 'Analytics',
      },
      {
        id: 'ads_read',
        name: 'Google Ads Access',
        description: 'View ad campaign performance and costs',
        required: false,
        category: 'Advertising',
      },
      {
        id: 'search_console',
        name: 'Search Console Access',
        description: 'Access search performance and indexing data',
        required: false,
        category: 'SEO',
      },
      {
        id: 'youtube_read',
        name: 'YouTube Analytics',
        description: 'View video performance and channel metrics',
        required: false,
        category: 'Analytics',
      },
    ],
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'Video',
    logo: '/logos/tiktok.webp',
    color: 'bg-black',
    oauthScopes: ['video_read', 'user_info', 'video_publish', 'ads_read'],
    permissions: [
      {
        id: 'video_read',
        name: 'Video Analytics',
        description: 'Access video performance and engagement metrics',
        required: true,
        category: 'Analytics',
      },
      {
        id: 'user_info',
        name: 'Profile Information',
        description: 'Read basic profile and account information',
        required: true,
        category: 'Account Access',
      },
      {
        id: 'video_publish',
        name: 'Publish Videos',
        description: 'Upload and publish videos to your account',
        required: false,
        category: 'Content Management',
      },
      {
        id: 'ads_read',
        name: 'TikTok Ads Access',
        description: 'View advertising campaign performance',
        required: false,
        category: 'Advertising',
      },
    ],
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    icon: 'ShoppingCart',
    logo: '/logos/shopify.png',
    color: 'bg-green-600',
    oauthScopes: ['store_access'],
    permissions: [
      {
        id: 'store_access',
        name: 'Store Access',
        description: 'Access to your Shopify store data and analytics',
        required: true,
        category: 'E-commerce',
      },
      {
        id: 'products_read',
        name: 'Read Products',
        description: 'View product catalog and inventory data',
        required: false,
        category: 'Products',
      },
      {
        id: 'orders_read',
        name: 'Read Orders',
        description: 'View order history and sales data',
        required: false,
        category: 'Orders',
      },
      {
        id: 'analytics_read',
        name: 'Store Analytics',
        description: 'Access store performance and sales analytics',
        required: false,
        category: 'Analytics',
      },
    ],
  },
};

export function getPlatformDefinition(platformId: string): PlatformDefinition | null {
  return PLATFORM_DEFINITIONS[platformId] || null;
}

export function getAllPlatforms(): PlatformDefinition[] {
  return Object.values(PLATFORM_DEFINITIONS);
}

export function getPlatformPermissions(platformId: string): PlatformPermission[] {
  const platform = getPlatformDefinition(platformId);
  return platform?.permissions || [];
}
