import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminAccount } from '@/lib/db/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    
    // TODO: Get real admin ID from authentication/session
    // For now, using a mock admin ID - replace with real auth
    const mockAdminId = '00000000-0000-0000-0000-000000000001';

    // Delete the platform connection
    await deleteAdminAccount(mockAdminId, platform);

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