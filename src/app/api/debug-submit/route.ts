import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, createOnboardingRequest } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    console.log('[Debug] Starting debug submit with token:', token);
    
    // Step 1: Test link lookup
    console.log('[Debug] Step 1: Looking up link...');
    const link = await getOnboardingLinkByToken(token);
    console.log('[Debug] Link found:', link);
    
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    // Step 2: Test minimal onboarding request creation
    console.log('[Debug] Step 2: Creating minimal onboarding request...');
    const testData = {
      link_id: link.id,
      client_email: 'debug@test.com',
      client_name: 'Debug Test',
      company_name: 'Debug Company',
      granted_permissions: { meta: ['basic'] },
      platform_connections: {},
      status: 'completed' as const,
    };
    
    console.log('[Debug] Test data:', testData);
    
    const result = await createOnboardingRequest(testData);
    console.log('[Debug] Onboarding request created:', result);
    
    return NextResponse.json({
      success: true,
      link: link,
      onboardingRequest: result
    });
    
  } catch (error) {
    console.error('[Debug] Error in debug submit:', error);
    return NextResponse.json({
      error: 'Debug submit failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
