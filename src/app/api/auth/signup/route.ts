import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName } = await request.json();
    
    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Use the regular Supabase client instead of admin client
    const supabase = await createClient();

    // Sign up the user using the regular auth flow
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
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      // Try to create user profile in users table
      try {
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
          console.error('Profile creation error:', profileError);
          // Don't fail here - the auth user is created
        }
      } catch (profileError) {
        console.error('Profile creation failed:', profileError);
        // Continue anyway - the auth user is created
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: authData.user,
        emailConfirmationSent: authData.user.email_confirmed_at === null
      });
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
