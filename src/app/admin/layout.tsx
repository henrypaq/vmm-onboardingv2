import { Header } from '@/components/layout/header';
// import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user data - replace with real auth
  const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin' as const,
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