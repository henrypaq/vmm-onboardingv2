import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinkByToken, updateOnboardingLink } from '@/lib/db/database';
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

    const isValid = isLinkValid(link.expiresAt, link.isUsed);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Link has expired or been used' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      clientId: link.clientId,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error('Link validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate link' },
      { status: 500 }
    );
  }
}
