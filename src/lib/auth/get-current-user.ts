import { createClient } from '@/lib/supabase/server';

/**
 * Get the current authenticated user ID from the session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    if (!session?.user) {
      console.log('No session found - user not authenticated');
      return null;
    }
    
    console.log('Authenticated user ID:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
