import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest, updateOnboardingLink } from '@/lib/db/database';
import { getOnboardingLinkByToken } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token, permissions, data } = await request.json();
    
    if (!token || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Token and permissions are required' },
        { status: 400 }
      );
    }

    // Validate the link
    const link = await getOnboardingLinkByToken(token);
    
    if (!link) {
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }

    if (link.isUsed) {
      return NextResponse.json(
        { error: 'Link has already been used' },
        { status: 410 }
      );
    }

    // Create the onboarding request
    const onboardingRequest = await createOnboardingRequest({
      clientId: link.clientId,
      linkId: link.id,
      status: 'pending',
      permissions,
      data: data || {},
    });

    // Mark the link as used
    await updateOnboardingLink(link.id, {
      isUsed: true,
      usedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      requestId: onboardingRequest.id,
    });
  } catch (error) {
    console.error('Onboarding submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit onboarding request' },
      { status: 500 }
    );
  }
}
