import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    console.log('[Test Pages Only] Starting pages-only debugging...');
    
    const results: any = {
      method1_me_accounts: {},
      method2_granular_scopes: {},
      method3_direct_me: {},
      summary: {}
    };

    // Method 1: /me/accounts (primary method) - use v20.0 for pages
    try {
      const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,fan_count,perms&access_token=${accessToken}`;
      console.log('[Test Pages Only] Method 1: Fetching from /me/accounts (v20.0)...');
      
      const response = await fetch(pagesUrl);
      results.method1_me_accounts = {
        status: response.status,
        url: pagesUrl.replace(accessToken, '[TOKEN]')
      };
      
      if (response.ok) {
        const data = await response.json();
        results.method1_me_accounts.data = data;
        
        if (data.data) {
          results.method1_me_accounts.accounts = data.data.map((account: any) => ({
            id: account.id,
            category: account.category,
            name: account.name
          }));
          
          const pages = data.data.filter((account: any) => {
            const isPage = account.category === 'Page' || 
                          account.category === 'Facebook Page' || 
                          account.category === 'PAGE' ||
                          account.category === 'FACEBOOK_PAGE';
            return isPage;
          });
          
          results.method1_me_accounts.pages = pages.map((page: any) => ({
            id: page.id,
            name: page.name || `Page ${page.id}`,
            type: 'page'
          }));
        }
      } else {
        const errorText = await response.text();
        results.method1_me_accounts.error = errorText;
      }
    } catch (error) {
      results.method1_me_accounts.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Method 2: Granular scopes parsing
    try {
      console.log('[Test Pages Only] Method 2: Parsing granular scopes...');
      const tokenInfoUrl = `https://graph.facebook.com/v18.0/oauth/access_token_info?access_token=${accessToken}`;
      
      const tokenResponse = await fetch(tokenInfoUrl);
      results.method2_granular_scopes = {
        status: tokenResponse.status,
        url: tokenInfoUrl.replace(accessToken, '[TOKEN]')
      };
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        results.method2_granular_scopes.tokenInfo = tokenData;
        
        const pageIds: string[] = [];
        if (tokenData.granular_scopes && Array.isArray(tokenData.granular_scopes)) {
          tokenData.granular_scopes.forEach((scope: any) => {
            if (scope.scope === 'pages_show_list' || 
                scope.scope === 'pages_read_engagement' || 
                scope.scope === 'pages_manage_posts') {
              if (scope.target_ids && Array.isArray(scope.target_ids)) {
                scope.target_ids.forEach((targetId: string) => {
                  if (/^\d+$/.test(targetId)) {
                    pageIds.push(targetId);
                  }
                });
              }
            }
          });
        }
        
        results.method2_granular_scopes.pageIds = [...new Set(pageIds)];
        
        // Test direct page query for each Page ID
        const granularPages: any[] = [];
        for (const pageId of pageIds) {
          try {
            const pageUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,fan_count&access_token=${accessToken}`;
            const pageResponse = await fetch(pageUrl);
            if (pageResponse.ok) {
              const pageData = await pageResponse.json();
              granularPages.push({
                id: pageData.id,
                name: pageData.name || `Page ${pageData.id}`,
                type: 'page'
              });
            }
          } catch (error) {
            console.log(`[Test Pages Only] Error fetching page ${pageId}:`, error);
          }
        }
        
        results.method2_granular_scopes.pages = granularPages;
      } else {
        const errorText = await tokenResponse.text();
        results.method2_granular_scopes.error = errorText;
      }
    } catch (error) {
      results.method2_granular_scopes.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Method 3: Direct /me endpoint (also use v20.0)
    try {
      console.log('[Test Pages Only] Method 3: Direct /me endpoint (v20.0)...');
      const directUrl = `https://graph.facebook.com/v20.0/me?fields=accounts{id,name,category}&access_token=${accessToken}`;
      
      const directResponse = await fetch(directUrl);
      results.method3_direct_me = {
        status: directResponse.status,
        url: directUrl.replace(accessToken, '[TOKEN]')
      };
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        results.method3_direct_me.data = directData;
        
        if (directData.accounts && directData.accounts.data) {
          const pages = directData.accounts.data
            .filter((account: any) => account.category === 'Page')
            .map((page: any) => ({
              id: page.id,
              name: page.name || `Page ${page.id}`,
              type: 'page'
            }));
          
          results.method3_direct_me.pages = pages;
        }
      } else {
        const errorText = await directResponse.text();
        results.method3_direct_me.error = errorText;
      }
    } catch (error) {
      results.method3_direct_me.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Summary
    results.summary = {
      method1Pages: results.method1_me_accounts.pages?.length || 0,
      method2Pages: results.method2_granular_scopes.pages?.length || 0,
      method3Pages: results.method3_direct_me.pages?.length || 0,
      totalPagesFound: (results.method1_me_accounts.pages?.length || 0) + 
                      (results.method2_granular_scopes.pages?.length || 0) + 
                      (results.method3_direct_me.pages?.length || 0)
    };

    console.log('[Test Pages Only] Final results:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[Test Pages Only] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test pages only' },
      { status: 500 }
    );
  }
}
