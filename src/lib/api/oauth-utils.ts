import { NextRequest } from 'next/server';

/**
 * OAuth platform configuration
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
}

/**
 * Get OAuth configuration for a platform
 */
export function getOAuthConfig(platform: string): OAuthConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  switch (platform) {
    case 'meta':
      return {
        clientId: process.env.NEXT_PUBLIC_META_APP_ID!,
        clientSecret: process.env.META_APP_SECRET!,
        redirectUri: `${baseUrl}/api/oauth/admin/connect/meta`,
        scope: ['ads_management', 'pages_read_engagement', 'pages_show_list', 'business_management', 'catalog_management', 'instagram_basic'],
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v17.0/oauth/access_token'
      };
      
    case 'google':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: `${baseUrl}/api/oauth/admin/connect/google`,
        scope: [
          'https://www.googleapis.com/auth/adwords',
          'https://www.googleapis.com/auth/analytics.readonly',
          'https://www.googleapis.com/auth/business.manage',
          'https://www.googleapis.com/auth/tagmanager.readonly',
          'https://www.googleapis.com/auth/webmasters.readonly',
          'https://www.googleapis.com/auth/content'
        ],
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token'
      };
      
    case 'shopify':
      return {
        clientId: process.env.SHOPIFY_CLIENT_ID!,
        clientSecret: process.env.SHOPIFY_CLIENT_SECRET!,
        redirectUri: `${baseUrl}/api/oauth/admin/connect/shopify`,
        scope: ['read_products', 'write_products', 'read_orders', 'write_orders'],
        authUrl: 'https://shopify.com/oauth/authorize',
        tokenUrl: 'https://shopify.com/oauth/access_token'
      };
      
    case 'tiktok':
      return {
        clientId: process.env.TIKTOK_CLIENT_ID!,
        clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
        redirectUri: `${baseUrl}/api/oauth/admin/connect/tiktok`,
        scope: ['user.info.basic'],
        authUrl: 'https://www.tiktok.com/auth/authorize',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token'
      };
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(platform: string, state?: string): string {
  const config = getOAuthConfig(platform);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(' '),
    response_type: 'code',
    ...(state && { state })
  });
  
  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(platform: string, code: string): Promise<any> {
  const config = getOAuthConfig(platform);
  
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${platform} token exchange failed: ${error}`);
  }
  
  return await response.json();
}

/**
 * Validate OAuth platform
 */
export function validateOAuthPlatform(platform: string): void {
  const validPlatforms = ['meta', 'google', 'shopify', 'tiktok'];
  if (!validPlatforms.includes(platform)) {
    throw new Error(`Invalid platform: ${platform}. Must be one of: ${validPlatforms.join(', ')}`);
  }
}

/**
 * Extract OAuth parameters from request
 */
export function extractOAuthParams(request: NextRequest): { code: string; state?: string; error?: string } {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }
  
  if (!code) {
    throw new Error('Authorization code is required');
  }
  
  return { code, state: state || undefined };
}
