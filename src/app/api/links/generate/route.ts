import { NextRequest, NextResponse } from 'next/server';
import { generateOnboardingLink } from '@/lib/links/link-generator';
import { createOnboardingLink } from '@/lib/db/database';
// import { requireAuth } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Link generation API called');
    
    // TODO: Implement proper authentication
    // const session = await requireAuth('admin');
    
    const requestBody = await request.json();
    console.log('📝 Request body:', requestBody);
    
    const { clientId, expiresInDays, platforms, requestedScopes } = requestBody;
    
    if (!clientId) {
      console.log('❌ Client ID missing');
      return NextResponse.json(
        { error: 'Client ID is required' },
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
      clientId,
      expiresInDays,
      platforms,
      requestedScopes
    });

    // Generate the link
    const generatedLink = generateOnboardingLink({
      clientId,
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
    const linkData = {
      admin_id: '00000000-0000-0000-0000-000000000001', // TODO: Use actual admin ID from session
      client_id: undefined, // Store as undefined for now, will reference clients table later
      token: generatedLink.token,
      platforms: platforms,
      requested_permissions: requestedScopes || {},
      expires_at: generatedLink.expiresAt.toISOString(),
      status: 'pending' as const,
      is_used: false,
      created_by: '00000000-0000-0000-0000-000000000001', // TODO: Use actual admin ID from session
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
