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
            // Only take the first ad account to avoid confusion (user typically selects one during OAuth)
            const primaryAdAccount = data.data[0];
            if (primaryAdAccount) {
              const adAccount = {
                id: primaryAdAccount.id,
                name: primaryAdAccount.name || `Ad Account ${primaryAdAccount.id}`,
                type: 'ad_account'
              };
              assets.push(adAccount);
              console.log('[Meta] Added primary ad account to assets:', adAccount);
              console.log('[Meta] Total ad accounts available:', data.data.length, '- showing only the first one');
            }
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
         if (assets.filter(asset => asset.type === 'catalog').length === 0) {
           console.log('[Meta] WARNING: No catalogs found despite catalog_management scope being present');
           console.log('[Meta] This could mean:');
           console.log('[Meta] 1. User has no catalogs in their Meta account');
           console.log('[Meta] 2. Catalog API endpoints are not working');
           console.log('[Meta] 3. Token lacks proper catalog permissions');
           
           // Add a placeholder catalog for testing purposes
           console.log('[Meta] Adding placeholder catalog for testing...');
           assets.push({
             id: 'catalog_placeholder',
             name: 'Product Catalog (Placeholder)',
             type: 'catalog'
           });
           console.log('[Meta] Added placeholder catalog for testing');
         }
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
  
  console.log('[Google] Starting asset fetch with scopes:', scopes);
  
  try {
    // Fetch Google Ads accounts if ads scope is present
    if (scopes.some(scope => scope.includes('adwords'))) {
      console.log('[Google] adwords scope detected, fetching Google Ads accounts...');
      try {
        const adsUrl = `https://googleads.googleapis.com/v14/customers?access_token=${accessToken}`;
        console.log('[Google] Fetching Google Ads accounts from:', adsUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(adsUrl);
        console.log('[Google] Google Ads response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Google] Google Ads response data:', data);
          
          if (data.resources && data.resources.length > 0) {
            console.log('[Google] Found Google Ads accounts:', data.resources);
            const adsAccounts = data.resources.map((account: any) => ({
              id: account.resourceName.replace('customers/', ''),
              name: account.descriptiveName || `Google Ads Account ${account.resourceName.replace('customers/', '')}`,
              type: 'ads_account'
            }));
            assets.push(...adsAccounts);
            console.log('[Google] Added Google Ads accounts to assets:', adsAccounts);
          } else {
            console.log('[Google] No Google Ads accounts found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Google] Google Ads fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Google] Failed to fetch Google Ads accounts:', error);
      }
    } else {
      console.log('[Google] adwords scope not found in scopes:', scopes);
    }

    // Fetch Analytics properties if analytics scope is present
    if (scopes.some(scope => scope.includes('analytics.readonly'))) {
      console.log('[Google] analytics.readonly scope detected, fetching Analytics properties...');
      try {
        const analyticsUrl = `https://analyticsadmin.googleapis.com/v1beta/accounts?access_token=${accessToken}`;
        console.log('[Google] Fetching Analytics accounts from:', analyticsUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(analyticsUrl);
        console.log('[Google] Analytics response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Google] Analytics response data:', data);
          
          if (data.accounts && data.accounts.length > 0) {
            console.log('[Google] Found Analytics accounts:', data.accounts);
            const analyticsAccounts = data.accounts.map((account: any) => ({
              id: account.name.replace('accounts/', ''),
              name: account.displayName || `Analytics Account ${account.name.replace('accounts/', '')}`,
              type: 'analytics_property'
            }));
            assets.push(...analyticsAccounts);
            console.log('[Google] Added Analytics accounts to assets:', analyticsAccounts);
          } else {
            console.log('[Google] No Analytics accounts found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Google] Analytics fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Google] Failed to fetch Analytics properties:', error);
      }
    } else {
      console.log('[Google] analytics.readonly scope not found in scopes:', scopes);
    }

    // Fetch Business Profile locations if business scope is present
    if (scopes.some(scope => scope.includes('business.manage'))) {
      console.log('[Google] business.manage scope detected, fetching Business Profile locations...');
      try {
        const businessUrl = `https://mybusinessaccountmanagement.googleapis.com/v1/accounts?access_token=${accessToken}`;
        console.log('[Google] Fetching Business Profile accounts from:', businessUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(businessUrl);
        console.log('[Google] Business Profile response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Google] Business Profile response data:', data);
          
          if (data.accounts && data.accounts.length > 0) {
            console.log('[Google] Found Business Profile accounts:', data.accounts);
            const businessAccounts = data.accounts.map((account: any) => ({
              id: account.name.replace('accounts/', ''),
              name: account.accountName || `Business Profile ${account.name.replace('accounts/', '')}`,
              type: 'business_profile'
            }));
            assets.push(...businessAccounts);
            console.log('[Google] Added Business Profile accounts to assets:', businessAccounts);
          } else {
            console.log('[Google] No Business Profile accounts found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Google] Business Profile fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Google] Failed to fetch Business Profile locations:', error);
      }
    } else {
      console.log('[Google] business.manage scope not found in scopes:', scopes);
    }

    // Fetch Tag Manager containers if tagmanager scope is present
    if (scopes.some(scope => scope.includes('tagmanager.readonly'))) {
      console.log('[Google] tagmanager.readonly scope detected, fetching Tag Manager containers...');
      try {
        const tagmanagerUrl = `https://tagmanager.googleapis.com/v2/accounts?access_token=${accessToken}`;
        console.log('[Google] Fetching Tag Manager accounts from:', tagmanagerUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(tagmanagerUrl);
        console.log('[Google] Tag Manager response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Google] Tag Manager response data:', data);
          
          if (data.account && data.account.length > 0) {
            console.log('[Google] Found Tag Manager accounts:', data.account);
            const tagmanagerAccounts = data.account.map((account: any) => ({
              id: account.accountId,
              name: account.name || `Tag Manager Account ${account.accountId}`,
              type: 'tag_manager'
            }));
            assets.push(...tagmanagerAccounts);
            console.log('[Google] Added Tag Manager accounts to assets:', tagmanagerAccounts);
          } else {
            console.log('[Google] No Tag Manager accounts found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Google] Tag Manager fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Google] Failed to fetch Tag Manager containers:', error);
      }
    } else {
      console.log('[Google] tagmanager.readonly scope not found in scopes:', scopes);
    }

    // Fetch Search Console properties if webmasters scope is present
    if (scopes.some(scope => scope.includes('webmasters.readonly'))) {
      console.log('[Google] webmasters.readonly scope detected, fetching Search Console sites...');
      try {
        const searchconsoleUrl = `https://www.googleapis.com/webmasters/v3/sites?access_token=${accessToken}`;
        console.log('[Google] Fetching Search Console sites from:', searchconsoleUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(searchconsoleUrl);
        console.log('[Google] Search Console response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Google] Search Console response data:', data);
          
          if (data.siteEntry && data.siteEntry.length > 0) {
            console.log('[Google] Found Search Console sites:', data.siteEntry);
            const searchconsoleSites = data.siteEntry.map((site: any) => ({
              id: site.siteUrl,
              name: site.siteUrl,
              type: 'search_console'
            }));
            assets.push(...searchconsoleSites);
            console.log('[Google] Added Search Console sites to assets:', searchconsoleSites);
          } else {
            console.log('[Google] No Search Console sites found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Google] Search Console fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Google] Failed to fetch Search Console properties:', error);
      }
    } else {
      console.log('[Google] webmasters.readonly scope not found in scopes:', scopes);
    }

    // Fetch Merchant Center accounts if content scope is present
    if (scopes.some(scope => scope.includes('content'))) {
      console.log('[Google] content scope detected, fetching Merchant Center accounts...');
      try {
        const merchantUrl = `https://shoppingcontent.googleapis.com/content/v2.1/accounts?access_token=${accessToken}`;
        console.log('[Google] Fetching Merchant Center accounts from:', merchantUrl.replace(accessToken, '[TOKEN]'));
        
        const response = await fetch(merchantUrl);
        console.log('[Google] Merchant Center response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Google] Merchant Center response data:', data);
          
          if (data.resources && data.resources.length > 0) {
            console.log('[Google] Found Merchant Center accounts:', data.resources);
            const merchantAccounts = data.resources.map((account: any) => ({
              id: account.id,
              name: account.name || `Merchant Center Account ${account.id}`,
              type: 'merchant_center'
            }));
            assets.push(...merchantAccounts);
            console.log('[Google] Added Merchant Center accounts to assets:', merchantAccounts);
          } else {
            console.log('[Google] No Merchant Center accounts found in response');
          }
        } else {
          const errorText = await response.text();
          console.log('[Google] Merchant Center fetch failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('[Google] Failed to fetch Merchant Center accounts:', error);
      }
    } else {
      console.log('[Google] content scope not found in scopes:', scopes);
    }

    // If no assets found, add placeholder
    if (assets.length === 0) {
      console.log('[Google] No assets found, adding placeholder');
      assets.push({
        id: 'placeholder',
        name: 'Basic Access (no advanced assets)',
        type: 'basic'
      });
    }
    
    console.log('[Google] Final assets list:', assets);
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
