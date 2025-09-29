import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createClient();
    const { clientId } = params;

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
      console.error('[Client Onboarding Request API] Error fetching request:', requestError);
      // Don't return 404, just return empty - client might not have an onboarding request
      return NextResponse.json({
        success: true,
        request: null
      });
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
