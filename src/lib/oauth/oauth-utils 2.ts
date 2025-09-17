import { createAdminPlatformConnection, updateAdminPlatformConnection, getAdminPlatformConnections } from '@/lib/db/database';
import { getOnboardingRequestByLinkId, updateOnboardingRequest } from '@/lib/db/database';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export interface OAuthUserInfo {
  id: string;
  name?: string;
  email?: string;
  username?: string;
}

// Google OAuth implementation
export async function exchangeGoogleCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google OAuth token exchange failed: ${error}`);
  }

  return response.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    username: data.email,
  };
}

// Meta OAuth implementation
export async function exchangeMetaCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta OAuth token exchange failed: ${error}`);
  }

  return response.json();
}

export async function getMetaUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name,email`);

  if (!response.ok) {
    throw new Error('Failed to fetch Meta user info');
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    username: data.name,
  };
}

// Admin OAuth flow - store platform connection
export async function handleAdminOAuthCallback(
  platform: string,
  code: string,
  redirectUri: string,
  adminId: string,
  scopes: string[]
): Promise<void> {
  let tokenResponse: OAuthTokenResponse;
  let userInfo: OAuthUserInfo;

  // Exchange code for token and get user info
  switch (platform) {
    case 'google':
      tokenResponse = await exchangeGoogleCodeForToken(code, redirectUri);
      userInfo = await getGoogleUserInfo(tokenResponse.access_token);
      break;
    case 'meta':
      tokenResponse = await exchangeMetaCodeForToken(code, redirectUri);
      userInfo = await getMetaUserInfo(tokenResponse.access_token);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Check if connection already exists
  const existingConnections = await getAdminPlatformConnections(adminId);
  const existingConnection = existingConnections.find(conn => 
    conn.platform === platform && conn.platform_user_id === userInfo.id
  );

  const connectionData = {
    admin_id: adminId,
    platform: platform as 'meta' | 'google' | 'tiktok' | 'shopify',
    platform_user_id: userInfo.id,
    platform_username: userInfo.username || userInfo.name,
    access_token: tokenResponse.access_token, // In production, encrypt this
    refresh_token: tokenResponse.refresh_token,
    token_expires_at: tokenResponse.expires_in 
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : undefined,
    scopes,
    is_active: true,
  };

  if (existingConnection) {
    // Update existing connection
    await updateAdminPlatformConnection(existingConnection.id, connectionData);
  } else {
    // Create new connection
    await createAdminPlatformConnection(connectionData);
  }
}

// Client OAuth flow - store in onboarding request
export async function handleClientOAuthCallback(
  platform: string,
  code: string,
  redirectUri: string,
  token: string,
  scopes: string[]
): Promise<void> {
  let tokenResponse: OAuthTokenResponse;
  let userInfo: OAuthUserInfo;

  // Exchange code for token and get user info
  switch (platform) {
    case 'google':
      tokenResponse = await exchangeGoogleCodeForToken(code, redirectUri);
      userInfo = await getGoogleUserInfo(tokenResponse.access_token);
      break;
    case 'meta':
      tokenResponse = await exchangeMetaCodeForToken(code, redirectUri);
      userInfo = await getMetaUserInfo(tokenResponse.access_token);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Get the onboarding request for this token
  const onboardingRequest = await getOnboardingRequestByLinkId(token);
  if (!onboardingRequest) {
    throw new Error('Onboarding request not found');
  }

  // Update the onboarding request with platform connection
  const platformConnections = onboardingRequest.platform_connections || {};
  platformConnections[platform] = {
    platform_user_id: userInfo.id,
    platform_username: userInfo.username || userInfo.name,
    access_token: tokenResponse.access_token, // In production, encrypt this
    refresh_token: tokenResponse.refresh_token,
    token_expires_at: tokenResponse.expires_in 
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : undefined,
    scopes,
    connected_at: new Date().toISOString(),
  };

  await updateOnboardingRequest(onboardingRequest.id, {
    platform_connections: platformConnections,
  });
}

// Generate OAuth URLs
export function generateOAuthUrl(
  platform: string,
  redirectUri: string,
  scopes: string[],
  state: string,
  additionalParams: Record<string, string> = {}
): string {
  const baseParams = {
    redirect_uri: redirectUri,
    scope: scopes.join(','),
    response_type: 'code',
    state,
    ...additionalParams,
  };

  switch (platform) {
    case 'google':
      return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        ...baseParams,
      })}`;
    
    case 'meta':
      return `https://www.facebook.com/v18.0/dialog/oauth?${new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        ...baseParams,
      })}`;
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}


