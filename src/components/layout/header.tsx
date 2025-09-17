'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components 2/ui/button';
import { Badge } from '@/components 2/ui/badge';
import { Mountain, User, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'client';
  };
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  
  // Determine which navigation items to show based on user role
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  
  const adminNavItems = [
    { href: '/admin/clients', label: 'Clients' },
    { href: '/admin/links', label: 'Links' },
    { href: '/admin/settings', label: 'Settings' },
  ];
  
  const clientNavItems = [
    { href: '/client', label: 'Dashboard' },
    { href: '/client/requests', label: 'Requests' },
    { href: '/client/settings', label: 'Settings' },
  ];
  
  const navItems = isAdmin ? adminNavItems : isClient ? clientNavItems : [];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-lg">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">VAST</span>
        </Link>

        {/* Navigation */}
        {navItems.length > 0 && (
          <nav className="flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Guest User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || 'guest'}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
