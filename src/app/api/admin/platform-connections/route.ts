import { NextRequest, NextResponse } from 'next/server';
import { getAdminPlatformConnections } from '@/lib/db/database';
import { getCurrentUserId } from '@/lib/auth/get-current-user';

// Force dynamic rendering - this route uses cookies and authentication
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    // Get authenticated user ID
    const adminId = await getCurrentUserId();
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Fetch admin platform connections for this specific admin
    const connections = await getAdminPlatformConnections(adminId);

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