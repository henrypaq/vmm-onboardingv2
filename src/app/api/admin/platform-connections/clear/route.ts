import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth/get-current-user';

// Force dynamic rendering - this route uses authentication
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Clear all admin platform connections for the current user
 * POST /api/admin/platform-connections/clear
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await getCurrentUserId();
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Soft delete: set is_active to false
    const { data, error } = await supabaseAdmin
      .from('admin_platform_connections')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .select();

    if (error) {
      console.error('Error clearing connections:', error);
      return NextResponse.json({
        error: 'Failed to clear connections',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${data?.length || 0} active connection(s)`,
      clearedCount: data?.length || 0,
      adminId
    });

  } catch (error) {
    console.error('Error clearing platform connections:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
