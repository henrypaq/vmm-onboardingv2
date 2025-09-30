// OAuth scopes mapping for each provider
// Maps scope keys to human-readable descriptions

export const scopes = {
  google: {
    "openid": "OpenID Connect (required for account identification)",
    "email": "Email address (required for account identification)",
    "profile": "Basic profile information (required for account identification)",
    "https://www.googleapis.com/auth/adwords": "Google Ads Account - Manage ad campaigns and billing",
    "https://www.googleapis.com/auth/analytics.readonly": "Google Analytics Account - Read website and app analytics data",
    "https://www.googleapis.com/auth/business.manage": "Google Business Profile Location - Manage business listings and reviews",
    "https://www.googleapis.com/auth/tagmanager.readonly": "Google Tag Manager - Read tag configuration and data",
    "https://www.googleapis.com/auth/webmasters.readonly": "Google Search Console - Read search performance and sitemap data"
  },
  meta: {
    "ads_management": "Ad Accounts - Manage Facebook and Instagram ad campaigns",
    "pages_show_list": "View list of your Facebook Pages",
    "pages_read_engagement": "Read Page content and engagement data", 
    "pages_manage_posts": "Create and manage posts on your Pages",
    "catalog_management": "Catalogs - Manage product catalogs for shopping ads",
    "business_management": "Datasets (Business Manager) - Access business data and insights",
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

// Define which scopes are available for selection (Leadsie-style)
export const availableScopes = {
  google: [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/analytics.readonly", 
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/tagmanager.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly"
    // openid, email, profile are always included automatically
  ],
  meta: [
    "ads_management",
    "pages_show_list",
    "pages_read_engagement", 
    "pages_manage_posts",
    "catalog_management",
    "business_management",
    "instagram_basic"
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

// Helper function to get Google scopes with required background scopes
export function getGoogleScopesWithRequired(selectedScopes: string[]): string[] {
  const requiredScopes = ['openid', 'email', 'profile'];
  return [...requiredScopes, ...selectedScopes];
}

// Helper function to get human-readable Google service names
export function getGoogleServiceName(scope: string): string {
  const serviceMap: Record<string, string> = {
    'https://www.googleapis.com/auth/adwords': 'Google Ads Account',
    'https://www.googleapis.com/auth/analytics.readonly': 'Google Analytics Account',
    'https://www.googleapis.com/auth/business.manage': 'Google Business Profile Location',
    'https://www.googleapis.com/auth/tagmanager.readonly': 'Google Tag Manager',
    'https://www.googleapis.com/auth/webmasters.readonly': 'Google Search Console'
  };
  return serviceMap[scope] || scope;
}

// Meta asset groups and their sub-scopes
export const metaAssetGroups = {
  'Ad Accounts': {
    scopes: ['ads_management'],
    available: true
  },
  'Pages': {
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    available: true
  },
  'Catalogs': {
    scopes: ['catalog_management'],
    available: true
  },
  'Datasets (Business Manager)': {
    scopes: ['business_management'],
    available: true
  },
  'Instagram Accounts': {
    scopes: ['instagram_basic'],
    available: true
  }
};

// Helper function to get Meta asset group name from scope
export function getMetaAssetGroupName(scope: string): string {
  for (const [groupName, groupData] of Object.entries(metaAssetGroups)) {
    if (groupData.scopes.includes(scope)) {
      return groupName;
    }
  }
  return scope;
}

// Helper function to check if all sub-scopes of a group are selected
export function areAllSubScopesSelected(groupName: string, selectedScopes: string[]): boolean {
  const group = metaAssetGroups[groupName as keyof typeof metaAssetGroups];
  if (!group) return false;
  return group.scopes.every(scope => selectedScopes.includes(scope));
}
