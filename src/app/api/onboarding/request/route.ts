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
    
    // Then get requests for this link
    const requests = await getOnboardingRequests(link.id);
    
    return NextResponse.json({ requests });
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

    // Try to find existing request for this link
    const { data: existing, error } = await supabase
      .from('onboarding_requests')
      .select('*')
      .eq('link_id', link.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Onboarding][request POST] fetch existing error:', error);
    }

    if (existing) {
      // Update lightweight client info if provided
      const { error: updErr } = await supabase
        .from('onboarding_requests')
        .update({ client_email, client_name, company_name })
        .eq('id', existing.id);
      if (updErr) console.warn('[Onboarding][request POST] update meta error:', updErr);
      return NextResponse.json({ success: true, requestId: existing.id });
    }

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


