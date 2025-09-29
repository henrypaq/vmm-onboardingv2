import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest, getOnboardingLinkByToken } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token, name, email, company } = await request.json();
    
    console.log('[Test] Creating onboarding request with:', { token, name, email, company });
    
    // Get a link to use
    const link = await getOnboardingLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    const testRequest = await createOnboardingRequest({
      link_id: link.id,
      client_id: null,
      client_email: email,
      client_name: name,
      company_name: company,
      granted_permissions: { test: ['basic'] },
      platform_connections: {},
      status: 'completed'
    });
    
    console.log('[Test] Created onboarding request:', testRequest);
    
    return NextResponse.json({
      success: true,
      request: testRequest
    });
  } catch (error) {
    console.error('[Test] Error creating onboarding request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test onboarding request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
