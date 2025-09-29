import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, createOnboardingRequest } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const token: string | undefined = rawBody.token;
    const testMode: boolean = Boolean(rawBody.testMode);
    const data: { name?: string; email?: string; company?: string } = rawBody.data ?? {
      name: rawBody.client_name,
      email: rawBody.client_email,
      company: rawBody.company_name,
    };
    let permissions: string[] | undefined = Array.isArray(rawBody.permissions)
      ? rawBody.permissions as string[]
      : undefined;
    
    console.log('[Simplified] Submit request received:', { token, testMode, data });
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Validate the link
    const link = await getOnboardingLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
    }

    // If no permissions provided, synthesize from link platforms
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      try {
        const requested = link.requested_permissions as Record<string, string[]> | null | undefined;
        if (requested && typeof requested === 'object') {
          const synthesized: string[] = [];
          for (const [platform, scopes] of Object.entries(requested)) {
            if (Array.isArray(scopes) && scopes.length > 0) {
              for (const s of scopes) synthesized.push(`${platform}:${s}`);
            } else {
              synthesized.push(`${platform}:basic`);
            }
          }
          permissions = synthesized;
        } else if (Array.isArray(link.platforms) && link.platforms.length > 0) {
          permissions = link.platforms.map((p) => `${p}:basic`);
        } else {
          permissions = [];
        }
      } catch {
        permissions = [];
      }
    }

    // Process permissions
    let grantedPermissions = {};
    try {
      grantedPermissions = permissions.reduce((acc: Record<string, string[]>, perm: string) => {
        const [platform, scope] = perm.split(':');
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(scope);
        return acc;
      }, {});
      console.log('[Simplified] Processed granted permissions:', grantedPermissions);
    } catch (error) {
      console.error('[Simplified] Error processing permissions:', error);
      grantedPermissions = { meta: ['basic'] };
    }
    
    // Create onboarding request (skip client creation and platform connections)
    const onboardingRequestData = {
      link_id: link.id,
      client_id: undefined, // Skip client creation for now
      client_email: data?.email,
      client_name: data?.name,
      company_name: data?.company,
      granted_permissions: grantedPermissions,
      platform_connections: {},
      status: 'completed' as const,
    };
    
    console.log('[Simplified] Creating onboarding request with data:', onboardingRequestData);
    
    const onboardingRequest = await createOnboardingRequest(onboardingRequestData);
    console.log('[Simplified] Created onboarding request:', onboardingRequest);

    return NextResponse.json({
      success: true,
      requestId: onboardingRequest?.id || 'unknown',
      message: 'Onboarding request submitted successfully'
    });
    
  } catch (error) {
    console.error('[Simplified] Onboarding submission error:', error);
    console.error('[Simplified] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to submit onboarding request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
