import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingLink } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    console.log('[Demo Link] Creating demo onboarding link...');
    
    // Create a demo onboarding link with all platforms
    const demoLink = await createOnboardingLink({
      admin_id: '00000000-0000-0000-0000-000000000001', // Demo admin ID
      link_name: 'Demo Onboarding Link',
      platforms: ['meta', 'google', 'tiktok'],
      requested_permissions: {
        meta: ['pages_read_engagement', 'pages_show_list'],
        google: ['openid', 'email', 'profile'],
        tiktok: ['user_info', 'video_read']
      },
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      status: 'active',
      is_used: false
    });

    console.log('[Demo Link] Created demo link:', demoLink);

    return NextResponse.json({
      success: true,
      link: demoLink,
      demoUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${demoLink.token}`
    });

  } catch (error) {
    console.error('[Demo Link] Error creating demo link:', error);
    return NextResponse.json(
      { error: 'Failed to create demo link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Demo Link] Getting demo link...');
    
    // Try to find existing demo link first
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    
    const { data: existingLink, error } = await supabase
      .from('onboarding_links')
      .select('*')
      .eq('link_name', 'Demo Onboarding Link')
      .eq('admin_id', '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Demo Link] Error fetching existing demo link:', error);
      return NextResponse.json(
        { error: 'Failed to fetch demo link' },
        { status: 500 }
      );
    }

    if (existingLink) {
      console.log('[Demo Link] Found existing demo link:', existingLink);
      return NextResponse.json({
        success: true,
        link: existingLink,
        demoUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${existingLink.token}`
      });
    }

    // Create new demo link if none exists
    const demoLink = await createOnboardingLink({
      admin_id: '00000000-0000-0000-0000-000000000001',
      link_name: 'Demo Onboarding Link',
      platforms: ['meta', 'google', 'tiktok'],
      requested_permissions: {
        meta: ['pages_read_engagement', 'pages_show_list'],
        google: ['openid', 'email', 'profile'],
        tiktok: ['user_info', 'video_read']
      },
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      is_used: false
    });

    console.log('[Demo Link] Created new demo link:', demoLink);

    return NextResponse.json({
      success: true,
      link: demoLink,
      demoUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app'}/onboarding/${demoLink.token}`
    });

  } catch (error) {
    console.error('[Demo Link] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get demo link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
