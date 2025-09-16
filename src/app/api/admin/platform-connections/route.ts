import { NextRequest, NextResponse } from 'next/server';
import { getAdminPlatformConnections } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    // For now, use hardcoded admin ID - in production, get from session/auth
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    const connections = await getAdminPlatformConnections(adminId);
    
    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching platform connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform connections' },
      { status: 500 }
    );
  }
}
