import { Header } from '@/components/layout/header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user data - replace with real auth
  const user = {
    name: 'Client User',
    email: 'client@example.com',
    role: 'client' as const,
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header user={user} userRole="client" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}