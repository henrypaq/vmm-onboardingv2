import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Get the current authenticated user ID from the session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Debug: Log cookie names (not values for security)
    const cookieNames = allCookies.map(c => c.name);
    console.log('Available cookies:', cookieNames);
    
    // Check for Supabase auth cookies
    const hasAuthCookies = cookieNames.some(name => 
      name.includes('sb-') && name.includes('auth-token')
    );
    console.log('Has Supabase auth cookies:', hasAuthCookies);
    
    const supabase = await createClient();
    
    // Try getSession first
    let session = null;
    let error = null;
    
    const sessionResult = await supabase.auth.getSession();
    session = sessionResult.data?.session;
    error = sessionResult.error;
    
    // If getSession fails, try getUser as fallback
    if (!session && !error) {
      console.log('getSession returned no session, trying getUser...');
      const userResult = await supabase.auth.getUser();
      if (userResult.data?.user) {
        // If getUser works, create a session-like object
        console.log('getUser succeeded, user ID:', userResult.data.user.id);
        return userResult.data.user.id;
      }
      if (userResult.error) {
        console.error('getUser error:', userResult.error);
        error = userResult.error;
      }
    }
    
    if (error) {
      console.error('Error getting session:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return null;
    }
    
    if (!session?.user) {
      console.log('No session found - user not authenticated');
      console.log('Cookie count:', allCookies.length);
      return null;
    }
    
    console.log('✅ Authenticated user ID:', session.user.id);
    console.log('✅ Session expires at:', session.expires_at);
    return session.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return null;
  }
}
