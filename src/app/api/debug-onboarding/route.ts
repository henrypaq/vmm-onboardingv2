import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest, getOnboardingLinkByToken, createClient } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const { token, name, email, company } = await request.json();
    
    console.log('[Debug] Test payload:', { token, name, email, company });
    
    // Get a link to use
    const link = await getOnboardingLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    
    console.log('[Debug] Found link:', link.id);
    
    // Test 1: Create client directly
    console.log('[Debug] Creating client...');
    const testClient = await createClient({
      admin_id: link.admin_id,
      email: email || 'debug@test.com',
      full_name: name || 'Debug User',
      company_name: company || 'Debug Company',
      status: 'active',
      last_onboarding_at: new Date().toISOString()
    });
    console.log('[Debug] Created client:', testClient);
    
    // Test 2: Create onboarding request directly
    console.log('[Debug] Creating onboarding request...');
    const testRequest = await createOnboardingRequest({
      link_id: link.id,
      client_id: testClient.id,
      client_email: email || 'debug@test.com',
      client_name: name || 'Debug User',
      company_name: company || 'Debug Company',
      granted_permissions: { test: ['debug'] },
      platform_connections: {},
      status: 'completed'
    });
    console.log('[Debug] Created onboarding request:', testRequest);
    
    return NextResponse.json({
      success: true,
      client: testClient,
      request: testRequest,
      link: link
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      { 
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
