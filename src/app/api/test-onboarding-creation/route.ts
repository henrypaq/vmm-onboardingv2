import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }
    
    // First get a real link_id from the database
    const { getOnboardingLinkByToken } = await import('@/lib/db/database');
    const link = await getOnboardingLinkByToken(token);
    
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    // Create a minimal test onboarding request
    const testData = {
      link_id: link.id, // Use actual link.id
      client_id: '00000000-0000-0000-0000-000000000000',
      client_email: 'test@example.com',
      client_name: 'Test User',
      company_name: 'Test Company',
      granted_permissions: { meta: ['basic'] },
      platform_connections: {},
      status: 'completed' as const,
    };
    
    console.log('[Test] Creating test onboarding request with data:', testData);
    
    const result = await createOnboardingRequest(testData);
    
    return NextResponse.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('[Test] Onboarding creation test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
