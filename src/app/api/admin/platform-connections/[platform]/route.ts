import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminAccount } from '@/lib/db/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    
    // TODO: Get admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';
    
    // Delete the admin account for this platform
    await deleteAdminAccount(mockAdminId, platform);
    
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
