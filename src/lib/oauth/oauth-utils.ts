import { createOrUpdateAdminAccount, AdminAccount } from '@/lib/db/database';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

export interface PlatformUserInfo {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  picture?: string;
}

export async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  switch (platform) {
    case 'meta':
      return await exchangeMetaToken(code, redirectUri);
    case 'google':
      return await exchangeGoogleToken(code, redirectUri);
    case 'tiktok':
      return await exchangeTikTokToken(code, redirectUri);
    case 'shopify':
      return await exchangeShopifyToken(code);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function exchangeMetaToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Meta OAuth credentials not configured');
  }

  const response = await fetch('https://graph.facebook.com/v17.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
  };
}

async function exchangeGoogleToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();
  // Log scopes returned by Google for diagnostics
  if (data.scope) {
    console.log('[GoogleOAuth] token scopes returned:', data.scope);
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
    id_token: data.id_token,
  };
}

async function exchangeTikTokToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  
  if (!clientKey || !clientSecret) {
    throw new Error('TikTok OAuth credentials not configured');
  }

  const response = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.data.access_token,
    expires_in: data.data.expires_in,
    token_type: data.data.token_type,
    scope: data.data.scope,
  };
}

async function exchangeShopifyToken(code: string): Promise<OAuthTokenResponse> {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  
  if (!clientId || !clientSecret || !shopDomain) {
    throw new Error('Shopify OAuth credentials not configured');
  }

  const response = await fetch(`https://${shopDomain}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    scope: data.scope,
  };
}

export async function fetchPlatformUserInfo(
  platform: string,
  accessToken: string,
  idToken?: string
): Promise<PlatformUserInfo> {
  switch (platform) {
    case 'meta':
      return await fetchMetaUserInfo(accessToken);
    case 'google':
      return await fetchGoogleUserInfo(accessToken, idToken);
    case 'tiktok':
      return await fetchTikTokUserInfo(accessToken);
    case 'shopify':
      return await fetchShopifyUserInfo(accessToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function fetchMetaUserInfo(accessToken: string): Promise<PlatformUserInfo> {
  // Use basic /me call that works with minimal scopes
  const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch Meta user info');
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    email: data.email,
  };
}

function decodeJwt(token: string): any {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

async function fetchGoogleUserInfo(accessToken: string, idToken?: string): Promise<PlatformUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const data = await response.json();
  const payload = idToken ? decodeJwt(idToken) : null;
  const stableId = payload?.sub || data.id;
  return {
    id: stableId,
    username: data.email,
    name: data.name,
    email: data.email,
    picture: data.picture,
  };
}

async function fetchTikTokUserInfo(accessToken: string): Promise<PlatformUserInfo> {
  const response = await fetch('https://open-api.tiktok.com/user/info/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch TikTok user info');
  }

  const data = await response.json();
  return {
    id: data.data.user.open_id,
    username: data.data.user.display_name,
    name: data.data.user.display_name,
  };
}

async function fetchShopifyUserInfo(accessToken: string): Promise<PlatformUserInfo> {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const response = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Shopify shop info');
  }

  const data = await response.json();
  return {
    id: data.shop.id.toString(),
    username: data.shop.name,
    name: data.shop.name,
    email: data.shop.email,
  };
}

export interface Asset {
  id: string;
  name: string;
  type: string;
}

export async function fetchPlatformAssets(
  platform: string,
  accessToken: string,
  scopes: string[]
): Promise<Asset[]> {
  switch (platform) {
    case 'meta':
      return await fetchMetaAssets(accessToken, scopes);
    case 'google':
      return await fetchGoogleAssets(accessToken, scopes);
    case 'tiktok':
      return await fetchTikTokAssets(accessToken, scopes);
    case 'shopify':
      return await fetchShopifyAssets(accessToken, scopes);
    default:
      return [];
  }
}

async function fetchMetaAssets(accessToken: string, scopes: string[]): Promise<Asset[]> {
  const assets: Asset[] = [];
  
  console.log('[Meta] Starting asset fetch with scopes:', scopes);
  
  try {
    // Fetch ad accounts if ads_management scope is present
    if (scopes.some(scope => scope.includes('ads_management') || scope.includes('ads_read'))) {
      console.log('[Meta] ads_management scope detected, fetching ad accounts...');
      try {
        const adAccountUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}`;
        console.log('[Meta] Fetching ad accounts from:', adAccountUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(adAccountUrl);
        console.log('[Meta] Ad account response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Meta] Ad account response data:', data);
          
          if (data.data) {
            console.log('[Meta] Found ad accounts:', data.data);
            console.log('[Meta] Ad account count from API:', data.data.length);
            console.log('[Meta] Ad account IDs:', data.data.map((a: any) => a.id));
            console.log('[Meta] Ad account names:', data.data.map((a: any) => a.name));
            
            // Limit to only one ad account to avoid confusion (user selects one during OAuth)
            // Take the first ad account as it's usually the primary/default
            const adAccounts = data.data.slice(0, 1).map((account: any) => ({
              id: account.id,
              name: account.name || `Ad Account ${account.id}`,
              type: 'ad_account'
            }));
            
            console.log('[Meta] Processed ad accounts (limited to 1):', adAccounts);
            console.log('[Meta] Total ad accounts available:', data.data.length, '- showing only the first one');
            assets.push(...adAccounts);
            console.log('[Meta] Added ad accounts to assets:', adAccounts);
            console.log('[Meta] Current total assets count:', assets.length);
          } else {
            console.log('[Meta] No ad account data found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Meta] Ad account fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Meta] Failed to fetch ad accounts:', error);
      }
    } else {
      console.log('[Meta] ads_management scope not found in scopes:', scopes);
    }

    // Fetch pages if pages_* scopes are present
    const hasPagesScopes = scopes.some(scope => scope.includes('pages_'));
    console.log('[Meta] Pages scope check:', { scopes, hasPagesScopes });
    
    if (hasPagesScopes) {
      console.log('[Meta] pages_* scope detected, fetching pages...');
      try {
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
        console.log('[Meta] Fetching pages from:', pagesUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(pagesUrl);
        console.log('[Meta] Pages response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Meta] Pages response data:', data);
          
          if (data.data) {
            console.log('[Meta] Found accounts:', data.data);
            console.log('[Meta] Account categories:', data.data.map((a: any) => ({ id: a.id, category: a.category, name: a.name })));
            
            // Filter for pages only (not ad accounts or other account types)
            // /me/accounts can return pages, ad accounts, and other account types
            const pages = data.data
              .filter((account: any) => {
                // Only include pages, exclude ad accounts and other types
                const isPage = account.category === 'Page' || 
                              account.category === 'Facebook Page' || 
                              account.category === 'PAGE' ||
                              account.category === 'FACEBOOK_PAGE';
                
                // For pages, we only need to check the category, not the ID
                // Pages and Ad Accounts can have the same ID in Meta's system
                const shouldInclude = isPage;
                
                console.log('[Meta] Page filtering check:', { 
                  id: account.id, 
                  category: account.category, 
                  name: account.name,
                  isPage,
                  shouldInclude 
                });
                
                return shouldInclude;
              })
              .map((page: any) => ({
                id: page.id,
                name: page.name || `Page ${page.id}`,
                type: 'page'
              }));
            console.log('[Meta] Filtered pages:', pages);
            assets.push(...pages);
            console.log('[Meta] Added pages to assets:', pages);
          } else {
            console.log('[Meta] No page data found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Meta] Pages fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Meta] Failed to fetch pages:', error);
      }
    } else {
      console.log('[Meta] pages_* scope not found in scopes:', scopes);
    }

    // Unified business data fetching - fetch businesses once and extract both catalogs and business datasets
    const needsBusinessData = scopes.some(scope => scope.includes('catalog_management') || scope.includes('business_management'));
    
    if (needsBusinessData) {
      console.log('[Meta] Business data needed for catalogs and/or business datasets, fetching businesses...');
      try {
        const businessUrl = `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`;
        console.log('[Meta] Fetching businesses from:', businessUrl.replace(accessToken, '[TOKEN]'));
        
        const businessResponse = await fetch(businessUrl);
        console.log('[Meta] Business response status:', businessResponse.status);
        
        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          console.log('[Meta] Business response data:', businessData);
          
          if (businessData.data && businessData.data.length > 0) {
            console.log('[Meta] Found businesses:', businessData.data);
            
            // Extract business datasets if business_management scope is present
            if (scopes.some(scope => scope.includes('business_management'))) {
              console.log('[Meta] Extracting business datasets from businesses...');
              const businessDatasets = businessData.data.map((business: any) => ({
                id: business.id,
                name: business.name || `Business ${business.id}`,
                type: 'business_dataset'
              }));
              assets.push(...businessDatasets);
              console.log('[Meta] Added business datasets to assets:', businessDatasets);
            }
            
            // Extract catalogs if catalog_management scope is present
            if (scopes.some(scope => scope.includes('catalog_management'))) {
              console.log('[Meta] Extracting catalogs from businesses...');
              let catalogsFound = false;
              
              // Try to fetch catalogs from each business
              for (const business of businessData.data) {
                try {
                  const catalogUrl = `https://graph.facebook.com/v18.0/${business.id}/owned_product_catalogs?access_token=${accessToken}`;
                  console.log('[Meta] Fetching catalogs for business', business.id, 'from:', catalogUrl.replace(accessToken, '[TOKEN]'));
                  
                  const catalogResponse = await fetch(catalogUrl);
                  console.log('[Meta] Catalog response status for business', business.id, ':', catalogResponse.status);
                  
                  if (catalogResponse.ok) {
                    const catalogData = await catalogResponse.json();
                    console.log('[Meta] Catalog response data for business', business.id, ':', catalogData);
                    
                    if (catalogData.data && catalogData.data.length > 0) {
                      console.log('[Meta] Found catalogs for business', business.id, ':', catalogData.data);
                      const catalogs = catalogData.data.map((catalog: any) => ({
                        id: catalog.id,
                        name: catalog.name || `Product Catalog ${catalog.id}`,
                        type: 'catalog'
                      }));
                      assets.push(...catalogs);
                      catalogsFound = true;
                      console.log('[Meta] Added business catalogs to assets:', catalogs);
                    } else {
                      console.log('[Meta] No catalogs found for business', business.id);
                    }
                  } else {
                    const errorText = await catalogResponse.text();
                    console.log('[Meta] Catalog fetch failed for business', business.id, ':', catalogResponse.status, errorText);
                  }
                } catch (businessError) {
                  console.log('[Meta] Failed to fetch catalogs for business', business.id, ':', businessError);
                }
              }
              
              // If no business catalogs found, try other methods
              if (!catalogsFound) {
                console.log('[Meta] No business catalogs found, trying alternative methods...');
                
                // Method 1: Try direct user-owned catalogs
                try {
                  const userCatalogUrl = `https://graph.facebook.com/v18.0/me?fields=owned_product_catalogs{id,name}&access_token=${accessToken}`;
                  console.log('[Meta] Fetching user catalogs from:', userCatalogUrl.replace(accessToken, '[TOKEN]'));
                  
                  const userCatalogResponse = await fetch(userCatalogUrl);
                  console.log('[Meta] User catalog response status:', userCatalogResponse.status);
                  
                  if (userCatalogResponse.ok) {
                    const userCatalogData = await userCatalogResponse.json();
                    console.log('[Meta] User catalog response data:', userCatalogData);
                    
                    if (userCatalogData.owned_product_catalogs && userCatalogData.owned_product_catalogs.data && userCatalogData.owned_product_catalogs.data.length > 0) {
                      console.log('[Meta] Found user-owned catalogs:', userCatalogData.owned_product_catalogs.data);
                      const userCatalogs = userCatalogData.owned_product_catalogs.data.map((catalog: any) => ({
                        id: catalog.id,
                        name: catalog.name || `Product Catalog ${catalog.id}`,
                        type: 'catalog'
                      }));
                      assets.push(...userCatalogs);
                      catalogsFound = true;
                      console.log('[Meta] Added user catalogs to assets:', userCatalogs);
                    }
                  }
                } catch (userError) {
                  console.log('[Meta] User catalog fetch error:', userError);
                }
                
                // Method 2: Try catalogs via /me/accounts
                if (!catalogsFound) {
                  try {
                    const accountsCatalogUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=owned_product_catalogs{id,name}&access_token=${accessToken}`;
                    console.log('[Meta] Fetching catalogs via accounts from:', accountsCatalogUrl.replace(accessToken, '[TOKEN]'));
                    
                    const accountsCatalogResponse = await fetch(accountsCatalogUrl);
                    console.log('[Meta] Accounts catalog response status:', accountsCatalogResponse.status);
                    
                    if (accountsCatalogResponse.ok) {
                      const accountsCatalogData = await accountsCatalogResponse.json();
                      console.log('[Meta] Accounts catalog response data:', accountsCatalogData);
                      
                      if (accountsCatalogData.data && accountsCatalogData.data.length > 0) {
                        const catalogsFromAccounts = [];
                        accountsCatalogData.data.forEach((account: any) => {
                          if (account.owned_product_catalogs && account.owned_product_catalogs.data && account.owned_product_catalogs.data.length > 0) {
                            console.log('[Meta] Found catalogs in account', account.id, ':', account.owned_product_catalogs.data);
                            catalogsFromAccounts.push(...account.owned_product_catalogs.data.map((catalog: any) => ({
                              id: catalog.id,
                              name: catalog.name || `Product Catalog ${catalog.id}`,
                              type: 'catalog'
                            })));
                          }
                        });
                        
                        if (catalogsFromAccounts.length > 0) {
                          assets.push(...catalogsFromAccounts);
                          catalogsFound = true;
                          console.log('[Meta] Added catalogs from accounts to assets:', catalogsFromAccounts);
                        }
                      }
                    }
                  } catch (accountsError) {
                    console.log('[Meta] Accounts catalog fetch error:', accountsError);
                  }
                }
              }
              
              console.log('[Meta] Final catalog assets found:', assets.filter(asset => asset.type === 'catalog'));
              if (!catalogsFound) {
                console.log('[Meta] WARNING: No catalogs found despite catalog_management scope being present');
              }
            }
          } else {
            console.log('[Meta] No business data found in response');
          }
        } else {
          const errorText = await businessResponse.text();
          console.log('[Meta] Business fetch failed:', businessResponse.status, errorText);
        }
      } catch (error) {
        console.log('[Meta] Failed to fetch business data:', error);
      }
    }

    // Fetch Instagram accounts if instagram_basic scope is present
    if (scopes.some(scope => scope.includes('instagram_basic'))) {
      console.log('[Meta] instagram_basic scope detected, fetching Instagram accounts...');
      try {
        const instagramUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account`;
        console.log('[Meta] Fetching Instagram accounts from:', instagramUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(instagramUrl);
        console.log('[Meta] Instagram response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Meta] Instagram response data:', data);
          
          if (data.data) {
            console.log('[Meta] Found accounts with Instagram data:', data.data);
            const instagramAccounts: Asset[] = [];
            data.data.forEach((account: any) => {
              if (account.instagram_business_account) {
                instagramAccounts.push({
                  id: account.instagram_business_account.id,
                  name: account.instagram_business_account.name || account.instagram_business_account.username || 'Instagram Account',
                  type: 'instagram_account'
                });
              }
            });
            console.log('[Meta] Found Instagram accounts:', instagramAccounts);
            assets.push(...instagramAccounts);
            console.log('[Meta] Added Instagram accounts to assets:', instagramAccounts);
          } else {
            console.log('[Meta] No Instagram account data found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Meta] Instagram fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Meta] Failed to fetch Instagram accounts:', error);
      }
    } else {
      console.log('[Meta] instagram_basic scope not found in scopes:', scopes);
    }

    // If no assets found, add placeholder
    if (assets.length === 0) {
      console.log('[Meta] No assets found, adding placeholder');
      assets.push({
        id: 'placeholder',
        name: 'Basic Access (no advanced assets)',
        type: 'basic'
      });
    }
    
    // Deduplicate assets by id and type to prevent duplicates
    const uniqueAssets = assets.reduce((acc: Asset[], current: Asset) => {
      const exists = acc.find(asset => asset.id === current.id && asset.type === current.type);
      if (!exists) {
        acc.push(current);
      } else {
        console.log('[Meta] Skipping duplicate asset:', current.id, current.type, current.name);
      }
      return acc;
    }, []);
    
    console.log('[Meta] Deduplication summary:', {
      originalCount: assets.length,
      uniqueCount: uniqueAssets.length,
      duplicatesRemoved: assets.length - uniqueAssets.length
    });
    
    console.log('[Meta] Final assets list (deduplicated):', uniqueAssets);
    console.log('[Meta] Asset counts by type:', {
      ad_accounts: uniqueAssets.filter(a => a.type === 'ad_account').length,
      pages: uniqueAssets.filter(a => a.type === 'page').length,
      catalogs: uniqueAssets.filter(a => a.type === 'catalog').length,
      business_datasets: uniqueAssets.filter(a => a.type === 'business_dataset').length,
      instagram_accounts: uniqueAssets.filter(a => a.type === 'instagram_account').length
    });
    
    return uniqueAssets;
  } catch (error) {
    console.error('[Meta] Error fetching assets:', error);
    assets.push({
      id: 'error',
      name: 'Unable to fetch assets',
      type: 'error'
    });
    return assets;
  }
}

async function fetchGoogleAssets(accessToken: string, scopes: string[]): Promise<Asset[]> {
  const assets: Asset[] = [];
  
  try {
    // Fetch Google Ads accounts if ads scope is present
    if (scopes.some(scope => scope.includes('adwords'))) {
      try {
        // For now, simulate Google Ads accounts since the API setup is complex
        assets.push({
          id: 'ads_placeholder',
          name: 'Google Ads Account (simulated)',
          type: 'ads_account'
        });
      } catch (error) {
        console.log('[Google] Failed to fetch ads accounts:', error);
      }
    }

    // Fetch Analytics properties if analytics scope is present
    if (scopes.some(scope => scope.includes('analytics.readonly'))) {
      try {
        // For now, simulate Analytics properties
        assets.push({
          id: 'analytics_placeholder',
          name: 'Google Analytics Property (simulated)',
          type: 'analytics_property'
        });
      } catch (error) {
        console.log('[Google] Failed to fetch analytics properties:', error);
      }
    }

    // Fetch Business Profile locations if business scope is present
    if (scopes.some(scope => scope.includes('business.manage'))) {
      try {
        assets.push({
          id: 'business_placeholder',
          name: 'Google Business Profile Location (simulated)',
          type: 'business_profile'
        });
      } catch (error) {
        console.log('[Google] Failed to fetch business profile:', error);
      }
    }

    // Fetch Tag Manager containers if tagmanager scope is present
    if (scopes.some(scope => scope.includes('tagmanager.readonly'))) {
      try {
        assets.push({
          id: 'tagmanager_placeholder',
          name: 'Google Tag Manager Container (simulated)',
          type: 'tag_manager'
        });
      } catch (error) {
        console.log('[Google] Failed to fetch tag manager:', error);
      }
    }

    // Fetch Search Console properties if webmasters scope is present
    if (scopes.some(scope => scope.includes('webmasters.readonly'))) {
      try {
        assets.push({
          id: 'searchconsole_placeholder',
          name: 'Google Search Console Property (simulated)',
          type: 'search_console'
        });
      } catch (error) {
        console.log('[Google] Failed to fetch search console:', error);
      }
    }

    // If no assets found, add placeholder
    if (assets.length === 0) {
      assets.push({
        id: 'placeholder',
        name: 'Basic Access (no advanced assets)',
        type: 'basic'
      });
    }
  } catch (error) {
    console.error('[Google] Error fetching assets:', error);
    assets.push({
      id: 'error',
      name: 'Unable to fetch assets',
      type: 'error'
    });
  }

  return assets;
}

async function fetchTikTokAssets(accessToken: string, scopes: string[]): Promise<Asset[]> {
  // TikTok asset fetching would go here
  return [{
    id: 'placeholder',
    name: 'TikTok Account (basic access)',
    type: 'account'
  }];
}

async function fetchShopifyAssets(accessToken: string, scopes: string[]): Promise<Asset[]> {
  // Shopify asset fetching would go here
  return [{
    id: 'placeholder',
    name: 'Shopify Store (basic access)',
    type: 'store'
  }];
}

export async function storePlatformConnection(
  adminId: string,
  platform: string,
  tokenResponse: OAuthTokenResponse,
  userInfo: PlatformUserInfo,
  scopes: string[]
): Promise<AdminAccount> {
  try {
    const expiresAt = tokenResponse.expires_in 
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : undefined;

    const accountData: Omit<AdminAccount, 'id' | 'created_at' | 'updated_at'> = {
      admin_id: adminId,
      provider: platform as 'google' | 'meta' | 'tiktok' | 'shopify',
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: expiresAt,
      scope: scopes,
      provider_user_id: userInfo.id,
      provider_email: userInfo.email,
      provider_name: userInfo.name || userInfo.username,
    };

    return await createOrUpdateAdminAccount(accountData);
  } catch (error) {
    console.error('Failed to store platform connection:', error);
    throw error;
  }
}
