import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName } = await request.json();
    
    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create user in auth.users using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        company_name: companyName,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      // Create user profile in users table
      const { error: profileError } = await supabaseAdmin
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
        return NextResponse.json({
          success: true,
          message: 'Account created but profile setup incomplete',
          user: authData.user
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: authData.user
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
