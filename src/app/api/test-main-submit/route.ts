import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, createOnboardingRequest } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token, data } = await request.json();
    console.log('[TestMain] Starting test with:', { token, data });
    
    // Step 1: Get link
    const link = await getOnboardingLinkByToken(token);
    console.log('[TestMain] Link found:', link);
    
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    // Step 2: Test permissions processing
    const permissions = ['meta:test_scope', 'google:test_scope'];
    console.log('[TestMain] Processing permissions:', permissions);
    
    let grantedPermissions = {};
    try {
      grantedPermissions = permissions.reduce((acc: Record<string, string[]>, perm: string) => {
        const [platform, scope] = perm.split(':');
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(scope);
        return acc;
      }, {});
      console.log('[TestMain] Processed granted permissions:', grantedPermissions);
    } catch (error) {
      console.error('[TestMain] Error processing permissions:', error);
      grantedPermissions = { meta: ['basic'] };
    }
    
    // Step 3: Create onboarding request with exact same data structure
    const onboardingRequestData = {
      link_id: link.id,
      client_id: undefined, // No client creation
      client_email: data?.email,
      client_name: data?.name,
      company_name: data?.company,
      granted_permissions: grantedPermissions,
      platform_connections: {},
      status: 'completed' as const,
    };
    
    console.log('[TestMain] Creating onboarding request with data:', onboardingRequestData);
    
    const result = await createOnboardingRequest(onboardingRequestData);
    console.log('[TestMain] Onboarding request created:', result);
    
    return NextResponse.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('[TestMain] Error:', error);
    return NextResponse.json({
      error: 'Test main submit failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
