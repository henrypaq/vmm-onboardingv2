import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const clientId = searchParams.get('clientId');

    if (!platform || !clientId) {
      return NextResponse.json(
        { error: 'Missing required parameters: platform, clientId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the platform connection for this client
    const { data: connection, error: connectionError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    // Fetch assets based on platform
    let assets = [];
    
    switch (platform) {
      case 'meta':
        assets = await fetchMetaAssets(connection.access_token);
        break;
      case 'google':
        assets = await fetchGoogleAssets(connection.access_token);
        break;
      case 'shopify':
        assets = await fetchShopifyAssets(connection);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    return NextResponse.json({ assets });

  } catch (error) {
    console.error('Error fetching platform assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

async function fetchMetaAssets(accessToken: string) {
  try {
    const assets = [];
    
    // Fetch Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,category`
    );
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      if (pagesData.data) {
        pagesData.data.forEach((page: any) => {
          assets.push({
            id: page.id,
            name: page.name,
            type: 'page',
            description: `${page.category || 'Facebook Page'}`
          });
        });
      }
    }

    // Fetch Ad Accounts
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status`
    );
    
    if (adAccountsResponse.ok) {
      const adAccountsData = await adAccountsResponse.json();
      if (adAccountsData.data) {
        adAccountsData.data.forEach((account: any) => {
          assets.push({
            id: account.id,
            name: account.name,
            type: 'ad_account',
            description: `Ad Account (${account.account_status})`
          });
        });
      }
    }

    // Fetch Instagram Accounts
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username}`
    );
    
    if (instagramResponse.ok) {
      const instagramData = await instagramResponse.json();
      if (instagramData.data) {
        instagramData.data.forEach((page: any) => {
          if (page.instagram_business_account) {
            assets.push({
              id: page.instagram_business_account.id,
              name: page.instagram_business_account.username,
              type: 'instagram_account',
              description: 'Instagram Business Account'
            });
          }
        });
      }
    }

    return assets;
  } catch (error) {
    console.error('Error fetching Meta assets:', error);
    return [];
  }
}

async function fetchGoogleAssets(accessToken: string) {
  try {
    const assets = [];
    
    // Fetch Google Analytics accounts
    const analyticsResponse = await fetch(
      `https://www.googleapis.com/analytics/v3/management/accounts?access_token=${accessToken}`
    );
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      if (analyticsData.items) {
        analyticsData.items.forEach((account: any) => {
          assets.push({
            id: account.id,
            name: account.name,
            type: 'analytics_account',
            description: 'Google Analytics Account'
          });
        });
      }
    }

    // Fetch Google Tag Manager accounts
    const gtmResponse = await fetch(
      `https://www.googleapis.com/tagmanager/v2/accounts?access_token=${accessToken}`
    );
    
    if (gtmResponse.ok) {
      const gtmData = await gtmResponse.json();
      if (gtmData.account) {
        gtmData.account.forEach((account: any) => {
          assets.push({
            id: account.accountId,
            name: account.name,
            type: 'tag_manager_account',
            description: 'Google Tag Manager Account'
          });
        });
      }
    }

    // Fetch Search Console sites
    const searchConsoleResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites?access_token=${accessToken}`
    );
    
    if (searchConsoleResponse.ok) {
      const searchConsoleData = await searchConsoleResponse.json();
      if (searchConsoleData.siteEntry) {
        searchConsoleData.siteEntry.forEach((site: any) => {
          assets.push({
            id: site.siteUrl,
            name: site.siteUrl,
            type: 'search_console_site',
            description: 'Google Search Console Site'
          });
        });
      }
    }

    return assets;
  } catch (error) {
    console.error('Error fetching Google assets:', error);
    return [];
  }
}

async function fetchShopifyAssets(connection: any) {
  try {
    const assets = [];
    
    // For Shopify, we use the store domain from the connection
    const storeDomain = connection.platform_user_id;
    
    if (storeDomain) {
      assets.push({
        id: storeDomain,
        name: storeDomain,
        type: 'store',
        description: 'Shopify Store'
      });
    }

    return assets;
  } catch (error) {
    console.error('Error fetching Shopify assets:', error);
    return [];
  }
}
