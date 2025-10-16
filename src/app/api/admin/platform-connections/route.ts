import { NextRequest, NextResponse } from 'next/server';
import { getAdminPlatformConnections } from '@/lib/db/database';

export async function GET(_request: NextRequest) {
  try {
    // Fetch admin platform connections from database (shared across all admins)
    const connections = await getAdminPlatformConnections();

    // Transform the data to match the expected format
    const formattedConnections = connections.map(conn => ({
      id: conn.platform,
      name: getPlatformDisplayName(conn.platform),
      username: conn.platform_username || 'Connected',
      status: 'connected',
      platform: conn.platform,
      scopes: conn.scopes || [],
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