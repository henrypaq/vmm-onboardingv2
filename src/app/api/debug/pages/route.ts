import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, scopes } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    console.log('[Debug Pages] Starting pages debugging with token and scopes:', { scopes });
    
    const results: any = {
      scopeCheck: {},
      primaryMethod: {},
      fallbackMethod: {},
      summary: {}
    };

    // 1. Check scope detection
    const hasPagesScopes = scopes?.some((scope: string) => scope.includes('pages_'));
    const pagesScopes = scopes?.filter((scope: string) => scope.includes('pages_'));
    
    results.scopeCheck = {
      allScopes: scopes,
      pagesScopes: pagesScopes,
      hasPagesScopes: hasPagesScopes
    };

    console.log('[Debug Pages] Scope check:', results.scopeCheck);

    if (!hasPagesScopes) {
      return NextResponse.json({
        error: 'No pages scopes found',
        results
      }, { status: 400 });
    }

    // 2. Try primary method: /me/accounts
    try {
      const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
      console.log('[Debug Pages] Fetching from primary endpoint:', pagesUrl.replace(accessToken, '[TOKEN]'));
      
      const response = await fetch(pagesUrl);
      results.primaryMethod.status = response.status;
      
      if (response.ok) {
        const data = await response.json();
        results.primaryMethod.data = data;
        
        if (data.data) {
          results.primaryMethod.accounts = data.data.map((account: any) => ({
            id: account.id,
            category: account.category,
            name: account.name,
            subcategory: account.subcategory
          }));
          
          // Filter for pages
          const pages = data.data.filter((account: any) => {
            const isPage = account.category === 'Page' || 
                          account.category === 'Facebook Page' || 
                          account.category === 'PAGE' ||
                          account.category === 'FACEBOOK_PAGE';
            return isPage;
          });
          
          results.primaryMethod.filteredPages = pages.map((page: any) => ({
            id: page.id,
            name: page.name || `Page ${page.id}`,
            category: page.category
          }));
          
          console.log('[Debug Pages] Primary method results:', results.primaryMethod);
        }
      } else {
        const errorText = await response.text();
        results.primaryMethod.error = errorText;
      }
    } catch (error) {
      results.primaryMethod.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 3. Try fallback method: /me?fields=accounts
    try {
      const directPagesUrl = `https://graph.facebook.com/v18.0/me?fields=accounts{id,name,category}&access_token=${accessToken}`;
      console.log('[Debug Pages] Fetching from fallback endpoint:', directPagesUrl.replace(accessToken, '[TOKEN]'));
      
      const directResponse = await fetch(directPagesUrl);
      results.fallbackMethod.status = directResponse.status;
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        results.fallbackMethod.data = directData;
        
        if (directData.accounts && directData.accounts.data) {
          results.fallbackMethod.accounts = directData.accounts.data.map((account: any) => ({
            id: account.id,
            category: account.category,
            name: account.name
          }));
          
          // Filter for pages
          const directPages = directData.accounts.data.filter((account: any) => account.category === 'Page');
          
          results.fallbackMethod.filteredPages = directPages.map((page: any) => ({
            id: page.id,
            name: page.name || `Page ${page.id}`,
            category: page.category
          }));
          
          console.log('[Debug Pages] Fallback method results:', results.fallbackMethod);
        }
      } else {
        const errorText = await directResponse.text();
        results.fallbackMethod.error = errorText;
      }
    } catch (error) {
      results.fallbackMethod.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 4. Summary
    results.summary = {
      primaryPagesFound: results.primaryMethod.filteredPages?.length || 0,
      fallbackPagesFound: results.fallbackMethod.filteredPages?.length || 0,
      totalPagesFound: (results.primaryMethod.filteredPages?.length || 0) + (results.fallbackMethod.filteredPages?.length || 0)
    };

    console.log('[Debug Pages] Final results:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[Debug Pages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to debug pages' },
      { status: 500 }
    );
  }
}
