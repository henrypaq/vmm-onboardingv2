import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = createClient();
    const { clientId } = await params;

    console.log('[Client Onboarding Request API] Fetching onboarding request for client:', clientId);

    // Fetch onboarding request for this client with link details
    const { data: request, error: requestError } = await supabase
      .from('onboarding_requests')
      .select(`
        *,
        link:onboarding_links(
          id,
          token,
          link_name,
          platforms,
          requested_permissions,
          created_at
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError) {
      console.warn('[Client Onboarding Request API] Not found by client_id, attempting fallback by client email');
      // Fallback: find client to get email, then fetch onboarding request by client_email
      const { data: clientRow } = await supabase
        .from('clients')
        .select('email, admin_id')
        .eq('id', clientId)
        .single();

      if (clientRow?.email) {
        const { data: requestByEmail } = await supabase
          .from('onboarding_requests')
          .select(`*, link:onboarding_links(id, token, link_name, platforms, requested_permissions, created_at)`) 
          .eq('client_email', clientRow.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (requestByEmail) {
          return NextResponse.json({ success: true, request: requestByEmail });
        }
      }

      // If still nothing, return empty (client may not have submitted yet)
      return NextResponse.json({ success: true, request: null });
    }

    console.log('[Client Onboarding Request API] Found request:', request);

    return NextResponse.json({
      success: true,
      request
    });

  } catch (error) {
    console.error('[Client Onboarding Request API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
