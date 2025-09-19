// OAuth scopes mapping for each provider
// Maps scope keys to human-readable descriptions

export const scopes = {
  google: {
    "openid email profile": "Basic profile access (name, email, profile picture)",
    "https://www.googleapis.com/auth/analytics.readonly": "Read Google Analytics data",
    "https://www.googleapis.com/auth/adwords": "Manage Google Ads campaigns"
  },
  meta: {
    "pages_show_list": "View list of your Facebook Pages",
    "pages_read_engagement": "Read Page content and engagement data",
    "ads_management": "Manage Facebook and Instagram ads"
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

// Helper function to get all available scopes for a provider
export function getScopesForProvider(provider: keyof typeof scopes): string[] {
  return Object.keys(scopes[provider]);
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
