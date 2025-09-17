import { NextRequest, NextResponse } from 'next/server';
import { getAllAdminAccounts, isAdminAccountValid } from '@/lib/db/database';

export async function GET() {
  try {
    // TODO: Get admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';
    
    const accounts = await getAllAdminAccounts(mockAdminId);
    
    // Transform the data for the frontend
    const transformedConnections = await Promise.all(
      accounts.map(async (account) => {
        const isValid = await isAdminAccountValid(mockAdminId, account.provider);
        return {
          id: account.provider,
          name: getPlatformDisplayName(account.provider),
          username: account.provider_name || account.provider_email || 'Connected',
          status: isValid ? 'connected' : 'inactive',
          platform: account.provider,
          scopes: account.scope,
          connectedAt: account.created_at,
          expiresAt: account.expires_at,
          isValid: isValid
        };
      })
    );
    
    return NextResponse.json({ connections: transformedConnections });
  } catch (error: unknown) {
    console.error('Error fetching admin platform connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform connections' },
      { status: 500 }
    );
  }
}

function getPlatformDisplayName(platform: string): string {
  switch (platform) {
    case 'meta': return 'Meta (Facebook)';
    case 'google': return 'Google';
    case 'tiktok': return 'TikTok';
    case 'shopify': return 'Shopify';
    default: return platform;
  }
}
