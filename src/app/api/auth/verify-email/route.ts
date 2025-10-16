import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the email with the code
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error('Email verification error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data.user) {
      // Create user profile in users table
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: data.user.user_metadata?.full_name || '',
            company_name: data.user.user_metadata?.company_name || '',
            role: 'admin'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway - the auth user is verified
        }
      } catch (profileError) {
        console.error('Profile creation failed:', profileError);
        // Continue anyway - the auth user is verified
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        user: data.user
      });
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
