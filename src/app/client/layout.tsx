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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}