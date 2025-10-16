import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check onboarding_links table structure
    const { data: linksData, error: linksError } = await supabaseAdmin
      .from('onboarding_links')
      .select('*')
      .limit(1);
    
    console.log('Links query result:', { data: linksData, error: linksError });
    
    // Check onboarding_requests table structure
    const { data: requestsData, error: requestsError } = await supabaseAdmin
      .from('onboarding_requests')
      .select('*')
      .limit(1);
    
    console.log('Requests query result:', { data: requestsData, error: requestsError });
    
    // Check clients table structure
    const { data: clientsData, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    console.log('Clients query result:', { data: clientsData, error: clientsError });
    
    return NextResponse.json({
      success: true,
      tables: {
        onboarding_links: { error: linksError, hasData: !!linksData },
        onboarding_requests: { error: requestsError, hasData: !!requestsData },
        clients: { error: clientsError, hasData: !!clientsData }
      }
    });
    
  } catch (error) {
    console.error('Schema verification error:', error);
    return NextResponse.json({
      error: 'Schema verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
