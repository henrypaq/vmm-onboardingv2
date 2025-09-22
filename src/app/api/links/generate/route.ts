import { NextRequest, NextResponse } from 'next/server';
import { generateOnboardingLink } from '@/lib/links/link-generator';
import { createOnboardingLink } from '@/lib/db/database';
import { getSupabaseAdmin } from '@/lib/supabase/server';
// import { requireAuth } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Link generation API called');
    
    // TODO: Implement proper authentication
    // const session = await requireAuth('admin');
    
    const requestBody = await request.json();
    console.log('📝 Request body:', requestBody);
    
    const { linkName, expiresInDays, platforms, requestedScopes } = requestBody;
    
    if (!linkName) {
      console.log('❌ Link name missing');
      return NextResponse.json(
        { error: 'Link name is required' },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      console.log('❌ No platforms selected');
      return NextResponse.json(
        { error: 'At least one platform must be selected' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, generating link...');
    console.log('📊 Input data:', {
      linkName,
      expiresInDays,
      platforms,
      requestedScopes
    });

    // Generate the link
    const generatedLink = generateOnboardingLink({
      clientId: linkName, // Use link name as client ID for now
      expiresInDays,
      createdBy: 'placeholder-admin-id', // TODO: Use actual admin ID from session
    });

    console.log('✅ Link generated:', {
      token: generatedLink.token,
      url: generatedLink.url,
      expiresAt: generatedLink.expiresAt.toISOString()
    });

    // Save to database
    console.log('💾 Saving to database...');
    
    // Test database connection first
    console.log('🔍 Testing database connection...');
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error: testError } = await supabaseAdmin
        .from('onboarding_links')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      console.log('✅ Database connection test passed');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
    
    const linkData = {
      admin_id: '00000000-0000-0000-0000-000000000001', // TODO: Use actual admin ID from session
      link_name: linkName, // Descriptive name for the onboarding link
      // client_id is intentionally omitted - onboarding links are public and don't require pre-existing clients
      token: generatedLink.token,
      platforms: platforms,
      requested_permissions: requestedScopes || {},
      expires_at: generatedLink.expiresAt.toISOString(),
      status: 'pending' as const,
    };
    
    console.log('📝 Database payload:', linkData);
    
    const savedLink = await createOnboardingLink(linkData);

    console.log('✅ Link saved successfully:', savedLink);

    return NextResponse.json({
      link: savedLink,
      url: generatedLink.url,
    });
  } catch (error) {
    console.error('❌ Link generation error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
