import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token, data } = await request.json();
    console.log('[Simple] Starting simple submit with:', { token, data });
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // Direct insert into onboarding_requests without complex logic
    const { data: result, error } = await supabaseAdmin
      .from('onboarding_requests')
      .insert([{
        link_id: '00000000-0000-0000-0000-000000000000', // Use placeholder
        client_email: data?.email || 'test@example.com',
        client_name: data?.name || 'Test User',
        company_name: data?.company || 'Test Company',
        granted_permissions: { meta: ['basic'] },
        platform_connections: {},
        status: 'completed'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('[Simple] Database error:', error);
      return NextResponse.json({ error: 'Database insert failed', details: error }, { status: 500 });
    }
    
    console.log('[Simple] Success:', result);
    return NextResponse.json({ success: true, result });
    
  } catch (error) {
    console.error('[Simple] Error:', error);
    return NextResponse.json({ 
      error: 'Simple submit failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
