import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    console.log(`[Client Link API] Fetching link for client: ${clientId}`);

    // Get onboarding request for this client
    const { data: request, error: requestError } = await supabaseAdmin
      .from('onboarding_requests')
      .select('link_id, client_email')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError) {
      console.log(`[Client Link API] No request found by client_id, trying by email`);
      
      // Fallback: get client email and find request by email
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('email')
        .eq('id', clientId)
        .single();

      if (client?.email) {
        const { data: requestByEmail } = await supabaseAdmin
          .from('onboarding_requests')
          .select('link_id')
          .eq('client_email', client.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (requestByEmail?.link_id) {
          // Get the link
          const { data: link } = await supabaseAdmin
            .from('onboarding_links')
            .select('token, link_name')
            .eq('id', requestByEmail.link_id)
            .single();

          if (link) {
            const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${link.token}`;
            console.log(`[Client Link API] Found link by email: ${linkUrl}`);
            return NextResponse.json({ 
              success: true, 
              linkUrl,
              linkName: link.link_name 
            });
          }
        }
      }
    } else if (request?.link_id) {
      // Get the link
      const { data: link } = await supabaseAdmin
        .from('onboarding_links')
        .select('token, link_name')
        .eq('id', request.link_id)
        .single();

      if (link) {
        const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${link.token}`;
        console.log(`[Client Link API] Found link by client_id: ${linkUrl}`);
        return NextResponse.json({ 
          success: true, 
          linkUrl,
          linkName: link.link_name 
        });
      }
    }

    console.log(`[Client Link API] No link found for client: ${clientId}`);
    return NextResponse.json({ 
      success: false, 
      linkUrl: null,
      linkName: null 
    });

  } catch (error) {
    console.error('[Client Link API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
