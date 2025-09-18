import { NextRequest, NextResponse } from 'next/server';
import { getAllAdminAccounts } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get real admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';

    // Fetch admin platform connections from database
    const connections = await getAllAdminAccounts(mockAdminId);

    // Transform the data to match the expected format
    const formattedConnections = connections.map(conn => ({
      id: conn.provider,
      name: getPlatformDisplayName(conn.provider),
      username: conn.provider_name || conn.provider_email || 'Connected',
      status: 'connected',
      platform: conn.provider,
      scopes: conn.scope || [],
      connectedAt: conn.created_at,
    }));

    return NextResponse.json({
      connections: formattedConnections,
      success: true
    });

  } catch (error) {
    console.error('Error fetching platform connections:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch platform connections',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getPlatformDisplayName(provider: string): string {
  switch (provider) {
    case 'meta':
      return 'Meta (Facebook)';
    case 'google':
      return 'Google';
    case 'tiktok':
      return 'TikTok';
    case 'shopify':
      return 'Shopify';
    default:
      return provider;
  }
}