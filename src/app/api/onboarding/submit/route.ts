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

    if (link.status === 'completed') {
      return NextResponse.json(
        { error: 'Link has already been used' },
        { status: 410 }
      );
    }

    // Create the onboarding request
    const onboardingRequest = await createOnboardingRequest({
      link_id: link.id,
      client_id: undefined, // Will be set when client connects
      client_email: data?.email,
      client_name: data?.name,
      company_name: data?.company,
      granted_permissions: permissions.reduce((acc: Record<string, string[]>, perm: string) => {
        const [platform, scope] = perm.split(':');
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(scope);
        return acc;
      }, {}),
      platform_connections: {},
      status: 'pending',
    });

    // Mark the link as completed
    await updateOnboardingLink(link.id, {
      status: 'completed',
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
