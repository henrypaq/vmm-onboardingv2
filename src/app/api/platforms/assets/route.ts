import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('=== PLATFORM ASSETS API START ===');
  
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const clientId = searchParams.get('clientId');

    console.log('Assets API request:', { platform, clientId });

    if (!platform || !clientId) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: platform, clientId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    console.log('Supabase admin client created');

    // Get the platform connection for this client
    console.log('Looking for platform connection:', { clientId, platform });
    const { data: connection, error: connectionError } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    console.log('Connection query result:', { connection, connectionError });

    if (connectionError || !connection) {
      console.log('Platform connection not found:', connectionError);
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    console.log('Found platform connection:', {
      id: connection.id,
      platform: connection.platform,
      platform_user_id: connection.platform_user_id,
      has_access_token: !!connection.access_token
    });

    // Fetch assets based on platform
    let assets = [];
    
    switch (platform) {
      case 'meta':
        console.log('Fetching Meta assets...');
        assets = await fetchMetaAssets(connection.access_token);
        console.log('Meta assets fetched:', assets);
        break;
      case 'google':
        console.log('Fetching Google assets...');
        assets = await fetchGoogleAssets(connection.access_token);
        console.log('Google assets fetched:', assets);
        break;
      case 'shopify':
        console.log('Fetching Shopify assets...');
        assets = await fetchShopifyAssets(connection);
        console.log('Shopify assets fetched:', assets);
        break;
      default:
        console.log('Unsupported platform:', platform);
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    console.log('=== PLATFORM ASSETS API SUCCESS ===');
    console.log('Returning assets:', assets);

    return NextResponse.json({ assets });

  } catch (error) {
    console.error('=== PLATFORM ASSETS API ERROR ===');
    console.error('Error fetching platform assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: error.message },
      { status: 500 }
    );
  }
}

async function fetchMetaAssets(accessToken: string) {
  console.log('=== FETCHING META ASSETS ===');
  console.log('Access token length:', accessToken?.length);
  
  try {
    const assets = [];
    
    // Fetch Pages
    console.log('Fetching Meta Pages...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,category`
    );
    
    console.log('Pages response status:', pagesResponse.status);
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      console.log('Pages data received:', pagesData);
      
      if (pagesData.data) {
        pagesData.data.forEach((page: any) => {
          const asset = {
            id: page.id,
            name: page.name,
            type: 'page',
            description: `${page.category || 'Facebook Page'}`
          };
          console.log('Adding page asset:', asset);
          assets.push(asset);
        });
      }
    } else {
      const errorText = await pagesResponse.text();
      console.error('Pages API error:', pagesResponse.status, errorText);
    }

    // Fetch Ad Accounts
    console.log('Fetching Meta Ad Accounts...');
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status`
    );
    
    console.log('Ad Accounts response status:', adAccountsResponse.status);
    
    if (adAccountsResponse.ok) {
      const adAccountsData = await adAccountsResponse.json();
      console.log('Ad Accounts data received:', adAccountsData);
      
      if (adAccountsData.data) {
        adAccountsData.data.forEach((account: any) => {
          const asset = {
            id: account.id,
            name: account.name,
            type: 'ad_account',
            description: `Ad Account (${account.account_status})`
          };
          console.log('Adding ad account asset:', asset);
          assets.push(asset);
        });
      }
    } else {
      const errorText = await adAccountsResponse.text();
      console.error('Ad Accounts API error:', adAccountsResponse.status, errorText);
    }

    // Fetch Instagram Accounts
    console.log('Fetching Meta Instagram Accounts...');
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username}`
    );
    
    console.log('Instagram response status:', instagramResponse.status);
    
    if (instagramResponse.ok) {
      const instagramData = await instagramResponse.json();
      console.log('Instagram data received:', instagramData);
      
      if (instagramData.data) {
        instagramData.data.forEach((page: any) => {
          if (page.instagram_business_account) {
            const asset = {
              id: page.instagram_business_account.id,
              name: page.instagram_business_account.username,
              type: 'instagram_account',
              description: 'Instagram Business Account'
            };
            console.log('Adding Instagram asset:', asset);
            assets.push(asset);
          }
        });
      }
    } else {
      const errorText = await instagramResponse.text();
      console.error('Instagram API error:', instagramResponse.status, errorText);
    }

    console.log('=== META ASSETS FETCH COMPLETE ===');
    console.log('Total assets found:', assets.length);
    console.log('Assets:', assets);

    return assets;
  } catch (error) {
    console.error('=== META ASSETS FETCH ERROR ===');
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
