import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Clients] Starting debug...');
    
    // Test 1: Check if Supabase client can be created
    console.log('[Debug Clients] Creating Supabase client...');
    const supabaseAdmin = getSupabaseAdmin();
    console.log('[Debug Clients] Supabase client created successfully');
    
    // Test 2: Check environment variables
    console.log('[Debug Clients] Environment check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    // Test 3: Try to connect to Supabase
    console.log('[Debug Clients] Testing Supabase connection...');
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('[Debug Clients] Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: error
      }, { status: 500 });
    }
    
    console.log('[Debug Clients] Supabase connection successful');
    
    // Test 4: Try to fetch clients with the admin ID
    const adminId = '00000000-0000-0000-0000-000000000001';
    console.log('[Debug Clients] Fetching clients for admin:', adminId);
    
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });
    
    if (clientsError) {
      console.error('[Debug Clients] Error fetching clients:', clientsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch clients',
        details: clientsError,
        tableExists: true
      }, { status: 500 });
    }
    
    console.log('[Debug Clients] Clients fetched successfully:', clients?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      clientsCount: clients?.length || 0,
      clients: clients || []
    });
    
  } catch (error) {
    console.error('[Debug Clients] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
