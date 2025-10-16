import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingLinks, deleteOnboardingLink } from '@/lib/db/database';

export async function GET(_request: NextRequest) {
  try {
    // Fetch onboarding links from database (shared across all admins)
    const links = await getOnboardingLinks();

    return NextResponse.json({
      links: links,
    });
  } catch (error) {
    console.error('Error fetching admin links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    
    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    // Delete the onboarding link
    await deleteOnboardingLink(linkId);

    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete link',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
