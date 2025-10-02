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
            const adAccounts = data.data.map((account: any) => ({
              id: account.id,
              name: account.name || `Ad Account ${account.id}`,
              type: 'ad_account'
            }));
            assets.push(...adAccounts);
            console.log('[Meta] Added ad accounts to assets:', adAccounts);
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
    if (scopes.some(scope => scope.includes('pages_'))) {
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
            console.log('[Meta] Found pages:', data.data);
            const pages = data.data.map((page: any) => ({
              id: page.id,
              name: page.name || `Page ${page.id}`,
              type: 'page'
            }));
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

    // Fetch catalogs if catalog_management scope is present
    if (scopes.some(scope => scope.includes('catalog_management'))) {
      console.log('[Meta] catalog_management scope detected, fetching catalogs...');
      try {
        // First try to get catalogs from user's owned product catalogs
        const catalogUrl = `https://graph.facebook.com/v18.0/me?fields=owned_product_catalogs{business,name,id}&access_token=${accessToken}`;
        console.log('[Meta] Fetching user catalogs from:', catalogUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(catalogUrl);
        console.log('[Meta] Catalog response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Meta] Catalog response data:', data);
          
          if (data.owned_product_catalogs && data.owned_product_catalogs.data) {
            console.log('[Meta] Found user catalogs:', data.owned_product_catalogs.data);
            assets.push(...data.owned_product_catalogs.data.map((catalog: any) => ({
              id: catalog.id,
              name: catalog.name || `Product Catalog ${catalog.id}`,
              type: 'catalog'
            })));
          } else {
            console.log('[Meta] No user catalogs found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Meta] User catalog fetch failed:', response.status, errorText);
        }
        
        // If no catalogs found via user endpoint, try business-owned catalogs
        if (assets.filter(asset => asset.type === 'catalog').length === 0) {
          console.log('[Meta] No user catalogs found, trying business catalogs...');
          try {
            const businessUrl = `https://graph.facebook.com/v18.0/me/businesses?fields=owned_product_catalogs{name,id}&access_token=${accessToken}`;
            console.log('[Meta] Fetching business catalogs from:', businessUrl.replace(accessToken, '[TOKEN]'));
            
            const businessResponse = await fetch(businessUrl);
            console.log('[Meta] Business catalog response status:', businessResponse.status);
            
            if (businessResponse.ok) {
              const businessData = await businessResponse.json();
              console.log('[Meta] Business catalog response data:', businessData);
              
              if (businessData.data) {
                businessData.data.forEach((business: any) => {
                  if (business.owned_product_catalogs && business.owned_product_catalogs.data) {
                    console.log('[Meta] Found business catalogs:', business.owned_product_catalogs.data);
                    assets.push(...business.owned_product_catalogs.data.map((catalog: any) => ({
                      id: catalog.id,
                      name: catalog.name || `Product Catalog ${catalog.id}`,
                      type: 'catalog'
                    })));
                  }
                });
              } else {
                console.log('[Meta] No business data found in response');
              }
            } else {
              const errorText = await businessResponse.text();
              console.log('[Meta] Business catalog fetch failed:', businessResponse.status, errorText);
            }
          } catch (businessError) {
            console.log('[Meta] Failed to fetch business-owned catalogs:', businessError);
          }
        }
        
        console.log('[Meta] Final catalog assets found:', assets.filter(asset => asset.type === 'catalog'));
      } catch (error) {
        console.log('[Meta] Failed to fetch catalogs:', error);
      }
    } else {
      console.log('[Meta] catalog_management scope not found in scopes:', scopes);
    }

    // Fetch business datasets if business_management scope is present
    if (scopes.some(scope => scope.includes('business_management'))) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            assets.push(...data.data.map((business: any) => ({
              id: business.id,
              name: business.name || `Business ${business.id}`,
              type: 'business_dataset'
            })));
          }
        }
      } catch (error) {
        console.log('[Meta] Failed to fetch business datasets:', error);
      }
    }

    // Fetch Instagram accounts if instagram_basic scope is present
    if (scopes.some(scope => scope.includes('instagram_basic'))) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            data.data.forEach((account: any) => {
              if (account.instagram_business_account) {
                assets.push({
                  id: account.instagram_business_account.id,
                  name: account.instagram_business_account.name || `Instagram Account ${account.instagram_business_account.id}`,
                  type: 'instagram_account'
                });
              }
            });
          }
        }
      } catch (error) {
        console.log('[Meta] Failed to fetch Instagram accounts:', error);
      }
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
    
    console.log('[Meta] Final assets list:', assets);
  } catch (error) {
    console.error('[Meta] Error fetching assets:', error);
    assets.push({
      id: 'error',
      name: 'Unable to fetch assets',
      type: 'error'
    });
  }

  return assets;
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
