import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName } = await request.json();
    
    console.log('🧪 [TEST SIGNUP] Starting test signup with:', { email, fullName, companyName });
    
    const supabase = await createClient();

    // Test 1: Check if we can connect to Supabase
    console.log('🧪 [TEST SIGNUP] Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('🧪 [TEST SIGNUP] Connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message
      }, { status: 500 });
    }
    
    console.log('🧪 [TEST SIGNUP] Connection test passed');

    // Test 2: Try to sign up user
    console.log('🧪 [TEST SIGNUP] Attempting user signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('🧪 [TEST SIGNUP] Auth signup failed:', authError);
      return NextResponse.json({
        success: false,
        error: 'Auth signup failed',
        details: authError.message
      }, { status: 400 });
    }

    console.log('🧪 [TEST SIGNUP] Auth signup successful:', authData.user?.id);

    // Test 3: Try to create user profile
    if (authData.user) {
      console.log('🧪 [TEST SIGNUP] Attempting profile creation...');
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          company_name: companyName,
          role: 'admin'
        });

      if (profileError) {
        console.error('🧪 [TEST SIGNUP] Profile creation failed:', profileError);
        return NextResponse.json({
          success: false,
          error: 'Profile creation failed',
          details: profileError.message,
          authUserCreated: true,
          userId: authData.user.id
        }, { status: 400 });
      }

      console.log('🧪 [TEST SIGNUP] Profile creation successful');
    }

    return NextResponse.json({
      success: true,
      message: 'Test signup completed successfully',
      user: authData.user,
      emailConfirmationSent: authData.user?.email_confirmed_at === null
    });

  } catch (error) {
    console.error('🧪 [TEST SIGNUP] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
