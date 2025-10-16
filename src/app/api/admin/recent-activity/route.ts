import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Temporary: Use a default admin ID for testing
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    // Get recent onboarding requests
    const { data: requests, error: requestsError } = await supabase
      .from('onboarding_requests')
      .select(`
        id,
        client_name,
        client_email,
        status,
        submitted_at,
        created_at,
        link_id
      `)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (requestsError) {
      console.error('[Recent Activity API] Error fetching requests:', requestsError);
      throw new Error(`Failed to fetch requests: ${requestsError.message}`);
    }

    // Get recent platform connections
    const { data: connections, error: connectionsError } = await supabase
      .from('client_platform_connections')
      .select(`
        id,
        platform,
        platform_username,
        created_at,
        client:clients(
          id,
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (connectionsError) {
      console.error('[Recent Activity API] Error fetching connections:', connectionsError);
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
    }

    // Get recent link generations
    const { data: links, error: linksError } = await supabase
      .from('onboarding_links')
      .select(`
        id,
        link_name,
        platforms,
        created_at
      `)
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (linksError) {
      console.error('[Recent Activity API] Error fetching links:', linksError);
      throw new Error(`Failed to fetch links: ${linksError.message}`);
    }

    // Combine and format activities
    const activities = [];

    // Add completed onboarding requests
    requests?.forEach(request => {
      activities.push({
        id: `request-${request.id}`,
        type: 'onboarding_completed',
        title: 'Client Onboarding Completed',
        description: `${request.client_name || request.client_email} completed onboarding`,
        timestamp: request.submitted_at || request.created_at,
        icon: 'Users',
        metadata: {
          clientName: request.client_name,
          clientEmail: request.client_email,
          linkId: request.link_id
        }
      });
    });

    // Add platform connections
    connections?.forEach(connection => {
      activities.push({
        id: `connection-${connection.id}`,
        type: 'platform_connected',
        title: 'Platform Connected',
        description: `${connection.client?.full_name || connection.client?.email} connected to ${connection.platform}`,
        timestamp: connection.created_at,
        icon: 'LinkIcon',
        metadata: {
          platform: connection.platform,
          clientName: connection.client?.full_name,
          clientEmail: connection.client?.email,
          platformUsername: connection.platform_username
        }
      });
    });

    // Add link generations
    links?.forEach(link => {
      activities.push({
        id: `link-${link.id}`,
        type: 'link_generated',
        title: 'Onboarding Link Generated',
        description: `Generated "${link.link_name}" for ${link.platforms?.join(', ') || 'multiple platforms'}`,
        timestamp: link.created_at,
        icon: 'LinkIcon',
        metadata: {
          linkName: link.link_name,
          platforms: link.platforms || []
        }
      });
    });

    // Sort by timestamp and limit to 20 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({ 
      success: true, 
      activities: sortedActivities 
    });

  } catch (error) {
    console.error('[Recent Activity API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch recent activity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
