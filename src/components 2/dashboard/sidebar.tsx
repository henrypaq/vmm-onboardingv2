'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib 2/utils';
import { Button } from '@/components 2/ui/button';
import { 
  Users, 
  Link as LinkIcon, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'client';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/links', label: 'Links', icon: LinkIcon },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const clientNavItems = [
    { href: '/client', label: 'Dashboard', icon: BarChart3 },
    { href: '/client/requests', label: 'My Requests', icon: Users },
    { href: '/client/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = role === 'admin' ? adminNavItems : clientNavItems;

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">Onboarding Platform</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-gray-700 text-white'
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-gray-700 p-3">
        <Button variant="ghost" className="w-full justify-start text-gray-300">
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
