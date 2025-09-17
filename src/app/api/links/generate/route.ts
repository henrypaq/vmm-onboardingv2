import { NextRequest, NextResponse } from 'next/server';
import { generateOnboardingLink } from '@/lib/links/link-generator';
import { createOnboardingLink } from '@/lib/db/database';
// import { requireAuth } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    // const session = await requireAuth('admin');
    
    const { clientId, expiresInDays } = await request.json();
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Generate the link
    const generatedLink = generateOnboardingLink({
      clientId,
      expiresInDays,
      createdBy: 'placeholder-admin-id', // TODO: Use actual admin ID from session
    });

    // Save to database
    const savedLink = await createOnboardingLink({
      clientId,
      token: generatedLink.token,
      expiresAt: generatedLink.expiresAt,
      isUsed: false,
      createdBy: 'placeholder-admin-id', // TODO: Use actual admin ID from session
    });

    return NextResponse.json({
      link: savedLink,
      url: generatedLink.url,
    });
  } catch (error) {
    console.error('Link generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate link' },
      { status: 500 }
    );
  }
}
