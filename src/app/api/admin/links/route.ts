import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinks, deleteOnboardingLink } from '@/lib/db/database';
import { getCurrentUserId } from '@/lib/auth/get-current-user';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    console.log('[Admin Links API] ===========================================');
    console.log('[Admin Links API] Fetching links for authenticated admin');
    console.log('[Admin Links API] ===========================================');
    
    // Get authenticated user ID
    const adminId = await getCurrentUserId();
    
    console.log('[Admin Links API] Admin ID from session:', adminId);
    
    if (!adminId) {
      console.error('[Admin Links API] ❌ No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[Admin Links API] ✅ Authenticated admin:', adminId);
    
    // Fetch onboarding links for this specific admin
    const links = await getOnboardingLinks(adminId);
    
    console.log('[Admin Links API] ===========================================');
    console.log('[Admin Links API] Found links:', links?.length || 0);
    if (links && links.length > 0) {
      console.log('[Admin Links API] Link details:', links.map(l => ({
        id: l.id,
        link_name: l.link_name,
        token: l.token,
        admin_id: l.admin_id,
        created_at: l.created_at
      })));
    } else {
      console.log('[Admin Links API] ⚠️ No links found for admin:', adminId);
      
      // Debug: Check all links in database to see if there's a mismatch
      const { getSupabaseAdmin } = await import('@/lib/supabase/server');
      const supabaseAdmin = getSupabaseAdmin();
      const { data: allLinks } = await supabaseAdmin
        .from('onboarding_links')
        .select('id, link_name, token, admin_id, created_at')
        .limit(10);
      console.log('[Admin Links API] All links in database (sample):', allLinks);
      if (allLinks && allLinks.length > 0) {
        console.log('[Admin Links API] Admin IDs in links:', allLinks.map(l => ({
          link_id: l.id,
          link_admin_id: l.admin_id,
          link_admin_id_type: typeof l.admin_id,
          current_admin_id: adminId,
          current_admin_id_type: typeof adminId,
          match: String(l.admin_id) === String(adminId)
        })));
      }
    }
    console.log('[Admin Links API] ===========================================');

    return NextResponse.json({
      links: links,
    });
  } catch (error) {
    console.error('Error fetching admin links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    
    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    // Delete the onboarding link
    await deleteOnboardingLink(linkId);

    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete link',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
