import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Get cookie names (for debugging, not values)
    const cookieNames = allCookies.map(c => c.name);
    const supabaseCookies = cookieNames.filter(name => name.includes('sb-'));
    
    // Try to get session
    const supabase = await createClient();
    const sessionResult = await supabase.auth.getSession();
    const userResult = await supabase.auth.getUser();
    
    return NextResponse.json({
      hasCookies: allCookies.length > 0,
      cookieCount: allCookies.length,
      supabaseCookieCount: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies,
      hasSession: !!sessionResult.data?.session,
      sessionUserId: sessionResult.data?.session?.user?.id || null,
      hasUser: !!userResult.data?.user,
      userId: userResult.data?.user?.id || null,
      sessionError: sessionResult.error?.message || null,
      userError: userResult.error?.message || null,
      authenticated: !!(sessionResult.data?.session?.user || userResult.data?.user),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
