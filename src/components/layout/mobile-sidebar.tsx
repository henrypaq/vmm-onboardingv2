'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Link as LinkIcon, 
  Settings, 
  Building2,
  Home,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MobileSidebarProps {
  userRole?: 'admin' | 'client';
}

export function MobileSidebar({ userRole = 'admin' }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const adminNavItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: Home,
    },
    { 
      href: '/admin/clients', 
      label: 'Clients', 
      icon: Users,
    },
    { 
      href: '/admin/links', 
      label: 'Links', 
      icon: LinkIcon,
    },
    { 
      href: '/admin/settings', 
      label: 'Settings', 
      icon: Settings,
    },
  ];

  const clientNavItems = [
    { 
      href: '/client', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
    },
    { 
      href: '/client/requests', 
      label: 'Requests', 
      icon: FileText,
    },
    { 
      href: '/client/settings', 
      label: 'Settings', 
      icon: Settings,
    },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : clientNavItems;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <SheetTitle className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Callisto AI</span>
            </SheetTitle>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                    isActive 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4 transition-all',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

