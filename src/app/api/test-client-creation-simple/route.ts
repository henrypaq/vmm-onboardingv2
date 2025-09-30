import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[Test Client Creation] Starting test...');
    
    const supabaseAdmin = getSupabaseAdmin();
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    // Test creating a simple client
    const testClient = {
      admin_id: adminId,
      email: `test-${Date.now()}@example.com`,
      full_name: 'Test Client',
      company_name: 'Test Company',
      status: 'active' as const
    };
    
    console.log('[Test Client Creation] Creating test client:', testClient);
    
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert([testClient])
      .select()
      .single();
    
    if (error) {
      console.error('[Test Client Creation] Error creating client:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create client',
        details: error
      }, { status: 500 });
    }
    
    console.log('[Test Client Creation] Client created successfully:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Test client created successfully',
      client: data
    });
    
  } catch (error) {
    console.error('[Test Client Creation] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
