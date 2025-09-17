import { NextRequest, NextResponse } from 'next/server';
import { getAdminPlatformConnections } from '@/lib 2/db/database';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';
    
    const connections = await getAdminPlatformConnections(mockAdminId);
    
    // Transform the data for the frontend
    const transformedConnections = connections.map(conn => ({
      id: conn.platform,
      name: getPlatformDisplayName(conn.platform),
      username: conn.platform_username || 'Connected',
      status: conn.is_active ? 'connected' : 'inactive',
      platform: conn.platform,
      scopes: conn.scopes,
      connectedAt: conn.created_at
    }));
    
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
