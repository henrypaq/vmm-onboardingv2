import { NextRequest, NextResponse } from 'next/server';
import { fetchPlatformAssets } from '@/lib/oauth/oauth-utils';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, scopes } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    console.log('[Test Fetch Assets] Testing fetchPlatformAssets with:', { scopes });
    
    // Test the current fetchPlatformAssets function directly
    const assets = await fetchPlatformAssets('meta', accessToken, scopes);
    
    console.log('[Test Fetch Assets] Result:', assets);
    
    const assetBreakdown = {
      ad_accounts: assets.filter(a => a.type === 'ad_account').length,
      pages: assets.filter(a => a.type === 'page').length,
      catalogs: assets.filter(a => a.type === 'catalog').length,
      business_datasets: assets.filter(a => a.type === 'business_dataset').length,
      instagram_accounts: assets.filter(a => a.type === 'instagram_account').length,
      total: assets.length
    };
    
    return NextResponse.json({
      success: true,
      assets: assets,
      assetBreakdown: assetBreakdown
    });

  } catch (error) {
    console.error('[Test Fetch Assets] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test fetch assets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
