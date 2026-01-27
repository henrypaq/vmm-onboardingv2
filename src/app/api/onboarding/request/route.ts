import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, getOnboardingRequests } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // First get the link by token
    const link = await getOnboardingLinkByToken(token);
    
    if (!link) {
      return NextResponse.json(
        { error: 'Onboarding link not found' },
        { status: 404 }
      );
    }
    
    // Check if there's an in_progress request that was just created by an OAuth callback
    // This allows the form to find the request that contains OAuth data
    // Only return requests that were created in the last 5 minutes (recent OAuth callbacks)
    const supabase = (await import('@/lib/supabase/server')).getSupabaseAdmin();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentRequests, error: requestsError } = await supabase
      .from('onboarding_requests')
      .select('id, status, platform_connections, client_email, client_name, company_name, created_at')
      .eq('link_id', link.id)
      .eq('status', 'in_progress')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // If there's a recent request with OAuth data, return it
    // Otherwise return empty (fresh start)
    let requests: any[] = [];
    if (recentRequests && recentRequests.length > 0) {
      const recentRequest = recentRequests[0];
      // Only return if it has platform connections (OAuth data was stored)
      if (recentRequest.platform_connections && Object.keys(recentRequest.platform_connections).length > 0) {
        requests = [recentRequest];
        console.log('[Onboarding][request GET] Returning recent request with OAuth data:', recentRequest.id);
      }
    }
    
    return NextResponse.json({ 
      link: {
        platforms: link.platforms,
        requested_permissions: link.requested_permissions,
        link_name: link.link_name
      },
      requests: requests // Return recent request with OAuth data, or empty for fresh start
    });
  } catch (error) {
    console.error('Error fetching onboarding request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding request' },
      { status: 500 }
    );
  }
}

// Create or ensure an in_progress onboarding request when a client opens the link
export async function POST(request: NextRequest) {
  try {
    const { token, client_email, client_name, company_name } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const link = await getOnboardingLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: 'Onboarding link not found' }, { status: 404 });
    }

    const supabase = (await import('@/lib/supabase/server')).getSupabaseAdmin();

    // Always create a new request for each flow - links are reusable
    // Don't check for existing requests - each link opening is a fresh start
    // This ensures each client gets their own independent onboarding flow

    // Create new in_progress request
    const { data: created, error: insErr } = await supabase
      .from('onboarding_requests')
      .insert([{ 
        link_id: link.id,
        client_email,
        client_name,
        company_name,
        status: 'in_progress',
        granted_permissions: {},
        platform_connections: {}
      }])
      .select()
      .single();

    if (insErr) {
      console.error('[Onboarding][request POST] insert error:', insErr);
      return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
    }

    return NextResponse.json({ success: true, requestId: created.id });
  } catch (error) {
    console.error('[Onboarding][request POST] error:', error);
    return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
  }
}


