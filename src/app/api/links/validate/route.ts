import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken } from '@/lib/db/database';
import { isLinkValid } from '@/lib/links/link-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const link = await getOnboardingLinkByToken(token);
    
    if (!link) {
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }

    // Check if link has expired
    const expiresAt = new Date(link.expires_at);
    const isValid = isLinkValid(expiresAt, link.status === 'completed');
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Link has expired or been used' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      adminId: link.admin_id,
      expiresAt: link.expires_at,
      platforms: link.platforms,
      requested_permissions: link.requested_permissions,
      link_name: link.link_name,
    });
  } catch (error) {
    console.error('Link validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate link' },
      { status: 500 }
    );
  }
}
