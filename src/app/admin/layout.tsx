import { Header } from '@/components/layout/header';
import { ToastContainer } from '@/components/ui/toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user data - authentication will be handled client-side
  const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin' as const,
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