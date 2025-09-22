import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingRequest, updateOnboardingLink, getOnboardingLinkByToken, getClientByEmail, createClient, updateClient } from '@/lib/db/database';

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

    // Handle client creation/update
    let clientId: string | undefined;
    if (data?.email) {
      // Check if client already exists for this admin
      const existingClient = await getClientByEmail(link.admin_id, data.email);
      
      if (existingClient) {
        // Update existing client
        const updatedClient = await updateClient(existingClient.id, {
          full_name: data.name || existingClient.full_name,
          company_name: data.company || existingClient.company_name,
          last_onboarding_at: new Date().toISOString(),
          status: 'active'
        });
        clientId = updatedClient.id;
        console.log(`Updated existing client: ${updatedClient.id}`);
      } else {
        // Create new client
        const newClient = await createClient({
          admin_id: link.admin_id,
          email: data.email,
          full_name: data.name,
          company_name: data.company,
          status: 'active',
          last_onboarding_at: new Date().toISOString()
        });
        clientId = newClient.id;
        console.log(`Created new client: ${newClient.id}`);
      }
    }

    // Create the onboarding request
    const onboardingRequest = await createOnboardingRequest({
      link_id: link.id,
      client_id: clientId,
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
      status: 'completed', // Mark as completed since client has granted access
    });

    // Mark the link as completed
    await updateOnboardingLink(link.id, {
      status: 'completed',
      client_id: clientId, // Link the client to the link
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
