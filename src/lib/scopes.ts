// OAuth scopes mapping for each provider
// Maps scope keys to human-readable descriptions

export const scopes = {
  google: {
    "openid email profile": "Basic profile access (name, email, profile picture)",
    "https://www.googleapis.com/auth/adwords": "Google Ads Account - Manage ad campaigns and billing",
    "https://www.googleapis.com/auth/analytics.readonly": "Google Analytics Account - Read website and app analytics data",
    "https://www.googleapis.com/auth/business.manage": "Google Business Profile Location - Manage business listings and reviews",
    "https://www.googleapis.com/auth/tagmanager.readonly": "Google Tag Manager - Read tag configuration and data",
    "https://www.googleapis.com/auth/webmasters.readonly": "Google Search Console - Read search performance and sitemap data",
    "https://www.googleapis.com/auth/content": "Google Merchant Center - Manage product listings and shopping campaigns"
  },
  meta: {
    "pages_show_list": "View list of your Facebook Pages",
    "pages_read_engagement": "Read Page content and engagement data",
    "ads_management": "Ad Account - Manage Facebook and Instagram ad campaigns",
    "pages_manage_posts": "Pages - Create and manage posts on your Pages",
    "catalog_management": "Catalogs - Manage product catalogs for shopping ads",
    "business_management": "Datasets - Access business data and insights",
    "instagram_basic": "Instagram Accounts - Access Instagram account information"
  },
  tiktok: {
    "user.info.basic": "Access basic user information",
    "video.publish": "Publish videos on your behalf",
    "video.list": "View your video content"
  },
  shopify: {
    "store_access": "Access to your Shopify store data"
  }
} as const;

// Define which scopes are available for testing
export const availableScopes = {
  google: [
    "openid email profile"
    // Other Google scopes disabled for testing
  ],
  meta: [
    "pages_show_list",
    "pages_read_engagement", 
    "ads_management",
    "pages_manage_posts"
    // Catalogs, Datasets, Instagram disabled for testing
  ],
  tiktok: [
    // TikTok disabled for now
  ],
  shopify: [
    "store_access"
  ]
} as const;

// Helper function to get all available scopes for a provider
export function getScopesForProvider(provider: keyof typeof scopes): string[] {
  return Object.keys(scopes[provider]);
}

// Helper function to get only the scopes available for testing
export function getAvailableScopesForProvider(provider: keyof typeof scopes): string[] {
  return [...(availableScopes[provider] || [])];
}

// Helper function to get description for a specific scope
export function getScopeDescription(provider: keyof typeof scopes, scope: string): string {
  return scopes[provider][scope as keyof typeof scopes[typeof provider]] || scope;
}

// Helper function to get all scopes for multiple providers
export function getScopesForProviders(providers: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  providers.forEach(provider => {
    if (provider in scopes) {
      result[provider] = getScopesForProvider(provider as keyof typeof scopes);
    }
  });
  
  return result;
}

// Helper function to validate selected scopes
export function validateScopes(provider: keyof typeof scopes, selectedScopes: string[]): boolean {
  const availableScopes = getScopesForProvider(provider);
  return selectedScopes.every(scope => availableScopes.includes(scope));
}
