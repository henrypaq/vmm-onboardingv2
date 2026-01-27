import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, getOnboardingRequests } from '@/lib/db/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    
    // Check if there's an in_progress request that was created recently
    // This could be from:
    // 1. Client info submission (has client_email, client_name)
    // 2. OAuth callback (has platform_connections)
    // Only return requests that were created in the last 5 minutes
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
    
    // Return the request if it has either:
    // 1. Client info (client_email, client_name) - from initial form submission
    // 2. Platform connections (OAuth data) - from OAuth callback
    let requests: any[] = [];
    if (recentRequests && recentRequests.length > 0) {
      const recentRequest = recentRequests[0];
      const hasClientInfo = recentRequest.client_email || recentRequest.client_name;
      const hasOAuthData = recentRequest.platform_connections && Object.keys(recentRequest.platform_connections).length > 0;
      
      if (hasClientInfo || hasOAuthData) {
        requests = [recentRequest];
        console.log('[Onboarding][request GET] Returning recent request:', {
          id: recentRequest.id,
          hasClientInfo,
          hasOAuthData,
          client_email: recentRequest.client_email,
          client_name: recentRequest.client_name
        });
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
    const requestBody = await request.json();
    const { token, client_email, client_name, company_name } = requestBody;

    console.log('[Onboarding][request POST] ===========================================');
    console.log('[Onboarding][request POST] CREATING ONBOARDING REQUEST');
    console.log('[Onboarding][request POST] ===========================================');
    console.log('[Onboarding][request POST] Request body:', requestBody);
    console.log('[Onboarding][request POST] Token:', token);
    console.log('[Onboarding][request POST] Client Email:', client_email);
    console.log('[Onboarding][request POST] Client Name:', client_name);
    console.log('[Onboarding][request POST] Company Name:', company_name);
    console.log('[Onboarding][request POST] ===========================================');

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

    const requestData = {
      link_id: link.id,
      client_email: client_email || null,
      client_name: client_name || null,
      company_name: company_name || null,
      status: 'in_progress',
      granted_permissions: {},
      platform_connections: {}
    };

    console.log('[Onboarding][request POST] Data to insert:', requestData);

    // Create new in_progress request
    const { data: created, error: insErr } = await supabase
      .from('onboarding_requests')
      .insert([requestData])
      .select()
      .single();

    if (insErr) {
      console.error('[Onboarding][request POST] ===========================================');
      console.error('[Onboarding][request POST] ❌ INSERT ERROR');
      console.error('[Onboarding][request POST] ===========================================');
      console.error('[Onboarding][request POST] Error:', insErr);
      console.error('[Onboarding][request POST] Error code:', insErr.code);
      console.error('[Onboarding][request POST] Error message:', insErr.message);
      console.error('[Onboarding][request POST] Data attempted:', requestData);
      console.error('[Onboarding][request POST] ===========================================');
      return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
    }

    console.log('[Onboarding][request POST] ===========================================');
    console.log('[Onboarding][request POST] ✅ REQUEST CREATED SUCCESSFULLY');
    console.log('[Onboarding][request POST] ===========================================');
    console.log('[Onboarding][request POST] Created request:', created);
    console.log('[Onboarding][request POST] Request ID:', created.id);
    console.log('[Onboarding][request POST] Client Email:', created.client_email);
    console.log('[Onboarding][request POST] Client Name:', created.client_name);
    console.log('[Onboarding][request POST] Company Name:', created.company_name);
    console.log('[Onboarding][request POST] ===========================================');

    return NextResponse.json({ success: true, requestId: created.id });
  } catch (error) {
    console.error('[Onboarding][request POST] ===========================================');
    console.error('[Onboarding][request POST] ❌ EXCEPTION');
    console.error('[Onboarding][request POST] ===========================================');
    console.error('[Onboarding][request POST] Error:', error);
    console.error('[Onboarding][request POST] ===========================================');
    return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
  }
}


