import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminPlatformConnectionByAdminAndPlatform } from '@/lib/db/database';
import { getCurrentUserId } from '@/lib/auth/get-current-user';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    
    // Get authenticated user ID
    const adminId = await getCurrentUserId();
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete the platform connection
    await deleteAdminPlatformConnectionByAdminAndPlatform(adminId, platform);

    return NextResponse.json({
      success: true,
      message: `${platform} connection deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting platform connection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete platform connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}