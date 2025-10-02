import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    console.log('[Test Meta Endpoints] Starting comprehensive Meta API testing...');
    
    const results: any = {
      tokenValidation: {},
      meAccounts_v18: {},
      meAccounts_v20: {},
      meAccounts_v21: {},
      meAccounts_v22: {},
      meAccounts_v23: {},
      granularScopes: {},
      directPageQuery: {},
      summary: {}
    };

    // 1. Token validation
    try {
      const tokenUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
      const tokenResponse = await fetch(tokenUrl);
      
      results.tokenValidation = {
        status: tokenResponse.status,
        url: tokenUrl.replace(accessToken, '[TOKEN]')
      };
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        results.tokenValidation.userInfo = {
          id: tokenData.id,
          name: tokenData.name
        };
      } else {
        const errorText = await tokenResponse.text();
        results.tokenValidation.error = errorText;
      }
    } catch (error) {
      results.tokenValidation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 2. Test /me/accounts across different API versions
    const apiVersions = ['v18.0', 'v20.0', 'v21.0', 'v22.0', 'v23.0'];
    
    for (const version of apiVersions) {
      try {
        const accountsUrl = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,fan_count,perms&access_token=${accessToken}`;
        console.log(`[Test Meta Endpoints] Testing ${version}/me/accounts...`);
        
        const response = await fetch(accountsUrl);
        const resultKey = `meAccounts_${version.replace('.', '_')}`;
        
        results[resultKey] = {
          status: response.status,
          url: accountsUrl.replace(accessToken, '[TOKEN]')
        };
        
        if (response.ok) {
          const data = await response.json();
          results[resultKey].data = data;
          
          if (data.data) {
            results[resultKey].accounts = data.data.map((account: any) => ({
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
            
            results[resultKey].pages = pages.map((page: any) => ({
              id: page.id,
              name: page.name || `Page ${page.id}`,
              type: 'page'
            }));
          }
        } else {
          const errorText = await response.text();
          results[resultKey].error = errorText;
          
          try {
            const errorData = JSON.parse(errorText);
            results[resultKey].errorDetails = {
              code: errorData.error?.code,
              message: errorData.error?.message,
              type: errorData.error?.type
            };
          } catch (parseError) {
            // Keep raw error text
          }
        }
      } catch (error) {
        const resultKey = `meAccounts_${version.replace('.', '_')}`;
        results[resultKey].error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // 3. Test granular scopes
    try {
      const tokenInfoUrl = `https://graph.facebook.com/v18.0/oauth/access_token_info?access_token=${accessToken}`;
      const tokenResponse = await fetch(tokenInfoUrl);
      
      results.granularScopes = {
        status: tokenResponse.status,
        url: tokenInfoUrl.replace(accessToken, '[TOKEN]')
      };
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        results.granularScopes.tokenInfo = tokenData;
        
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
        
        results.granularScopes.pageIds = [...new Set(pageIds)];
      } else {
        const errorText = await tokenResponse.text();
        results.granularScopes.error = errorText;
      }
    } catch (error) {
      results.granularScopes.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 4. Test direct page query for known Page ID
    const knownPageId = '597472923442970';
    try {
      const pageUrl = `https://graph.facebook.com/v20.0/${knownPageId}?fields=id,name,fan_count&access_token=${accessToken}`;
      const pageResponse = await fetch(pageUrl);
      
      results.directPageQuery = {
        status: pageResponse.status,
        url: pageUrl.replace(accessToken, '[TOKEN]'),
        pageId: knownPageId
      };
      
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        results.directPageQuery.data = pageData;
        results.directPageQuery.success = true;
      } else {
        const errorText = await pageResponse.text();
        results.directPageQuery.error = errorText;
      }
    } catch (error) {
      results.directPageQuery.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 5. Summary
    results.summary = {
      tokenValid: results.tokenValidation.status === 200,
      v18Pages: results.meAccounts_v18_0?.pages?.length || 0,
      v20Pages: results.meAccounts_v20_0?.pages?.length || 0,
      v21Pages: results.meAccounts_v21_0?.pages?.length || 0,
      v22Pages: results.meAccounts_v22_0?.pages?.length || 0,
      v23Pages: results.meAccounts_v23_0?.pages?.length || 0,
      granularScopesPageIds: results.granularScopes.pageIds?.length || 0,
      directPageQuerySuccess: results.directPageQuery.success || false,
      workingVersions: []
    };

    // Identify which versions work
    apiVersions.forEach(version => {
      const resultKey = `meAccounts_${version.replace('.', '_')}`;
      if (results[resultKey]?.status === 200) {
        results.summary.workingVersions.push(version);
      }
    });

    console.log('[Test Meta Endpoints] Final results:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[Test Meta Endpoints] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test Meta endpoints' },
      { status: 500 }
    );
  }
}
