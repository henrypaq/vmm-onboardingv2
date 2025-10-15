import { Header } from '@/components/layout/header';
import { ToastContainer } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, role')
    .eq('id', session.user.id)
    .single();

  // If no profile exists, create one with default values
  if (!profile) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || 'Admin User',
        company_name: session.user.user_metadata?.company_name || 'Unknown Company',
        role: 'admin'
      });

    if (insertError) {
      console.error('Error creating user profile:', insertError);
    }
  }

  const user = {
    name: profile?.full_name || session.user.user_metadata?.full_name || 'Admin User',
    email: profile?.email || session.user.email || 'admin@example.com',
    role: (profile?.role || 'admin') as 'admin' | 'client',
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header user={user} userRole="admin" />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}