import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth/get-current-user';

/**
 * Diagnostic endpoint to verify if a platform connection exists in the database
 * Usage: /api/admin/platform-connections/verify?platform=meta
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    
    const adminId = await getCurrentUserId();
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Query for the connection
    const { data, error } = await supabaseAdmin
      .from('admin_platform_connections')
      .select('*')
      .eq('admin_id', adminId)
      .eq('platform', platform || '')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error querying connections:', error);
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      adminId,
      platform: platform || 'all',
      found: data && data.length > 0,
      count: data?.length || 0,
      connections: data || [],
      message: data && data.length > 0 
        ? `Found ${data.length} active connection(s) for ${platform}`
        : `No active connections found for ${platform}`
    });

  } catch (error) {
    console.error('Error verifying platform connection:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
