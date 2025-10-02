import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, scopes } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    console.log('[Comprehensive Debug] Starting comprehensive pages debugging...');
    
    const results: any = {
      tokenValidation: {},
      scopeCheck: {},
      primaryMethod: {},
      granularScopesMethod: {},
      directPageQuery: {},
      fallbackMethod: {},
      summary: {}
    };

    // 1. Token validation
    try {
      const tokenTestUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
      const tokenResponse = await fetch(tokenTestUrl);
      
      results.tokenValidation = {
        status: tokenResponse.status,
        valid: tokenResponse.ok,
        url: tokenTestUrl.replace(accessToken, '[TOKEN]')
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

    // 2. Scope check
    const hasPagesScopes = scopes?.some((scope: string) => scope.includes('pages_'));
    const pagesScopes = scopes?.filter((scope: string) => scope.includes('pages_'));
    
    results.scopeCheck = {
      allScopes: scopes,
      pagesScopes: pagesScopes,
      hasPagesScopes: hasPagesScopes
    };

    if (!hasPagesScopes) {
      return NextResponse.json({
        error: 'No pages scopes found',
        results
      }, { status: 400 });
    }

    // 3. Primary method: /me/accounts
    try {
      const accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
      const accountsResponse = await fetch(accountsUrl);
      
      results.primaryMethod = {
        status: accountsResponse.status,
        url: accountsUrl.replace(accessToken, '[TOKEN]')
      };
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        results.primaryMethod.data = accountsData;
        
        if (accountsData.data) {
          results.primaryMethod.accounts = accountsData.data.map((account: any) => ({
            id: account.id,
            category: account.category,
            name: account.name
          }));
          
          const pages = accountsData.data.filter((account: any) => 
            account.category === 'Page' || account.category === 'Facebook Page'
          );
          
          results.primaryMethod.pages = pages.map((page: any) => ({
            id: page.id,
            name: page.name || `Page ${page.id}`,
            category: page.category
          }));
        }
      } else {
        const errorText = await accountsResponse.text();
        results.primaryMethod.error = errorText;
      }
    } catch (error) {
      results.primaryMethod.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 4. Granular scopes method - try multiple endpoints
    const granularEndpoints = [
      'https://graph.facebook.com/v18.0/oauth/access_token_info?access_token=',
      'https://graph.facebook.com/v18.0/debug_token?input_token=',
      'https://graph.facebook.com/v18.0/me/permissions?access_token='
    ];

    for (let i = 0; i < granularEndpoints.length; i++) {
      const endpoint = granularEndpoints[i];
      try {
        const granularUrl = `${endpoint}${accessToken}`;
        const granularResponse = await fetch(granularUrl);
        
        const methodKey = `granularMethod${i + 1}`;
        results[methodKey] = {
          endpoint: endpoint.replace('=', '[TOKEN]'),
          status: granularResponse.status
        };
        
        if (granularResponse.ok) {
          const granularData = await granularResponse.json();
          results[methodKey].data = granularData;
          
          // Look for granular scopes or permissions
          if (granularData.granular_scopes) {
            results[methodKey].granularScopes = granularData.granular_scopes;
            
            // Extract Page IDs
            const pageIds: string[] = [];
            granularData.granular_scopes.forEach((scope: any) => {
              if (scope.scope && scope.scope.includes('pages_')) {
                if (scope.target_ids) {
                  scope.target_ids.forEach((targetId: string) => {
                    if (/^\d+$/.test(targetId)) {
                      pageIds.push(targetId);
                    }
                  });
                }
              }
            });
            results[methodKey].pageIds = [...new Set(pageIds)];
          }
          
          if (granularData.data) {
            // Handle permissions format
            const pagePermissions = granularData.data.filter((perm: any) => 
              perm.permission && perm.permission.includes('pages_')
            );
            results[methodKey].pagePermissions = pagePermissions;
          }
        } else {
          const errorText = await granularResponse.text();
          results[methodKey].error = errorText;
        }
      } catch (error) {
        results[`granularMethod${i + 1}`].error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // 5. Direct page query (if we found Page ID 597472923442970)
    const knownPageId = '597472923442970';
    try {
      const pageUrl = `https://graph.facebook.com/v18.0/${knownPageId}?fields=id,name,fan_count&access_token=${accessToken}`;
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

    // 6. Summary
    results.summary = {
      tokenValid: results.tokenValidation.valid,
      hasPagesScopes: results.scopeCheck.hasPagesScopes,
      primaryMethodPages: results.primaryMethod.pages?.length || 0,
      granularScopesFound: results.granularMethod1?.pageIds?.length || 0,
      directPageQuerySuccess: results.directPageQuery.success || false,
      totalPagesFound: (results.primaryMethod.pages?.length || 0) + (results.granularMethod1?.pageIds?.length || 0)
    };

    console.log('[Comprehensive Debug] Final results:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[Comprehensive Debug] Error:', error);
    return NextResponse.json(
      { error: 'Failed to debug pages comprehensively' },
      { status: 500 }
    );
  }
}
