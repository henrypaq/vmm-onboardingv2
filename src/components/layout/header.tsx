'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, LogOut, Settings, LayoutDashboard, Users, Link as LinkIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'client';
  };
  userRole?: 'admin' | 'client';
}

interface PlatformConnection {
  id: string;
  name: string;
  username: string;
  status: string;
  platform: string;
  scopes: string[];
  connectedAt: string;
}

export function Header({ user, userRole }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = userRole || user?.role;
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  
  const initials = (currentUser?.name || user?.name)
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  // Fetch current user data only once and cache
  useEffect(() => {
    // Check if we already have cached user data
    const cachedUser = sessionStorage.getItem('currentUser');
    if (cachedUser) {
      setCurrentUser(JSON.parse(cachedUser));
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, email, role')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            // Capitalize first and last name
            const capitalizeName = (name: string) => {
              return name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            };
            
            const userData = {
              name: profile.full_name ? capitalizeName(profile.full_name) : 'User',
              email: profile.email || session.user.email || '',
              role: profile.role || 'admin'
            };
            
            setCurrentUser(userData);
            // Cache the user data
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
          } else {
            const userData = {
              name: session.user.user_metadata?.full_name || 'User',
              email: session.user.email || '',
              role: 'admin'
            };
            setCurrentUser(userData);
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear cached user data
      sessionStorage.removeItem('currentUser');
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  
  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/links', label: 'Links', icon: LinkIcon },
    { href: '/admin/clients', label: 'Clients', icon: Users },
  ];
  
  const clientNavItems = [
    { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
  ];
  
  const navItems = role === 'admin' ? adminNavItems : clientNavItems;

  return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 px-6">
      <div className="flex w-full items-center justify-between">
        {/* Logo */}
        <div className="flex items-center w-48">
          <Link href="/" className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center">
              <Image 
                src="/logos/vast.webp" 
                alt="Vast Logo" 
                width={48} 
                height={48}
                className="rounded-lg"
                style={{ width: 'auto', height: 'auto' }}
              />
          </div>
        </Link>
        </div>

        {/* Centered Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-1 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => {
            const Icon = item.icon;
              const isActive = pathname === item.href;
            
              return (
              <Link key={item.href} href={item.href}>
                <div className="relative px-6 py-3 group cursor-pointer transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600")} />
                    <span className={cn("text-base font-medium transition-colors relative", isActive ? "text-purple-600" : "text-gray-600 group-hover:text-purple-600")}>
                      {item.label}
                      {/* Underline animation */}
                      <span className={cn("absolute bottom-0 left-0 h-0.5 bg-purple-600 transition-all duration-300", isActive ? "w-full" : "w-0 group-hover:w-full")}></span>
                    </span>
                  </div>
                </div>
                </Link>
              );
            })}
          </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4 w-48 justify-end">
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className="relative h-9 w-auto px-3 rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
                  {currentUser?.name || user?.name || 'Guest User'}
                </span>
                <Avatar className="h-8 w-8 border-2 border-gray-200">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg p-1">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{currentUser?.name || user?.name || 'Guest User'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email || user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                onClick={() => setProfileOpen(true)}
                className="px-3 py-2 cursor-pointer focus:bg-gray-100 rounded-md"
              >
                <User className="mr-2 h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/admin/settings')}
                className="px-3 py-2 cursor-pointer focus:bg-gray-100 rounded-md"
              >
                <Settings className="mr-2 h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-700 focus:bg-red-50 px-3 py-2 cursor-pointer rounded-md" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="w-[90vw] max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Update your personal information and profile picture.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">
                    {currentUser?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  variant="outline"
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-medium">{currentUser?.name || user?.name || 'Guest User'}</h3>
                <p className="text-sm text-gray-500">{currentUser?.email || user?.email || ''}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Change Photo
                </Button>
              </div>
            </div>

            <Separator />

            {/* Personal Information Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    defaultValue={currentUser?.name?.split(' ')[0] || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    defaultValue={currentUser?.name?.split(' ').slice(1).join(' ') || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  defaultValue={currentUser?.email || user?.email || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Enter your company name"
                  defaultValue=""
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  defaultValue=""
                />
              </div>
            </div>

            <Separator />

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Security</h3>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
          </div>
        </div>
      </div>

          <div className="flex justify-end space-x-2 pt-6">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setProfileOpen(false)}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
