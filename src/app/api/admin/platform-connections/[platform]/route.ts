import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminPlatformConnection, getAdminPlatformConnections } from '@/lib/db/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform;
    
    // TODO: Get admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';
    
    // First, find the connection for this admin and platform
    const connections = await getAdminPlatformConnections(mockAdminId);
    const connectionToDelete = connections.find(conn => conn.platform === platform);
    
    if (!connectionToDelete) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }
    
    // Delete the connection
    await deleteAdminPlatformConnection(connectionToDelete.id);
    
    return NextResponse.json({ 
      message: `${platform} connection disconnected successfully` 
    });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}
