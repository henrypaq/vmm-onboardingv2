import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingRequestByLinkId } from '@/lib/db/database';

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
    
    const request = await getOnboardingRequestByLinkId(token);
    
    if (!request) {
      return NextResponse.json(
        { error: 'Onboarding request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ request });
  } catch (error) {
    console.error('Error fetching onboarding request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding request' },
      { status: 500 }
    );
  }
}
