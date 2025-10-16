import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Test basic connection
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('onboarding_links')
      .select('*')
      .limit(1);
    
    if (linkError) {
      console.error('Link query error:', linkError);
      return NextResponse.json({ error: 'Link query failed', details: linkError }, { status: 500 });
    }
    
    // Test clients table
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.error('Client query error:', clientError);
      return NextResponse.json({ error: 'Client query failed', details: clientError }, { status: 500 });
    }
    
    // Test onboarding_requests table
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('onboarding_requests')
      .select('*')
      .limit(1);
    
    if (requestError) {
      console.error('Request query error:', requestError);
      return NextResponse.json({ error: 'Request query failed', details: requestError }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: {
        links: linkData?.length || 0,
        clients: clientData?.length || 0,
        requests: requestData?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Debug DB error:', error);
    return NextResponse.json({ 
      error: 'Database debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
