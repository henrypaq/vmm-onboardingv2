import { Header } from '@/components/layout/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Header component will fetch real user data from Supabase session
  // Pass placeholder that will be replaced by Header's useEffect
  const user = {
    name: 'Loading...',
    email: '',
    role: 'admin' as const,
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Header user={user} userRole="admin" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}