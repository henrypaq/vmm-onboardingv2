'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Link as LinkIcon, 
  Settings, 
  Building2,
  Home,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: 'admin' | 'client';
}

export function Sidebar({ userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname();

  const adminNavItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: Home,
      badge: null
    },
    { 
      href: '/admin/clients', 
      label: 'Clients', 
      icon: Users,
      badge: null
    },
    { 
      href: '/admin/links', 
      label: 'Links', 
      icon: LinkIcon,
      badge: null
    },
    { 
      href: '/admin/settings', 
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ];

  const clientNavItems = [
    { 
      href: '/client', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      href: '/client/requests', 
      label: 'Requests', 
      icon: FileText,
      badge: null
    },
    { 
      href: '/client/settings', 
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : clientNavItems;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Callisto AI</span>
        </Link>
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
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                isActive 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-lg bg-accent"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className={cn(
                'relative h-4 w-4 transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className="relative">{item.label}</span>
              {item.badge && (
                <span className="relative ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          © 2025 Callisto AI
        </p>
      </div>
    </div>
  );
}

