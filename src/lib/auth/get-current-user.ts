import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Get the current authenticated user ID from the session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }
    
    return session.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
