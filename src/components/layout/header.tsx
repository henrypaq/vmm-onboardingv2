'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Bell, User, LogOut, Settings, LayoutDashboard, Users, Link as LinkIcon, Globe, Shield, Save, Plus, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const platforms = getAllPlatforms();
  
  const initials = (currentUser?.name || user?.name)
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  // Fetch current user data
  useEffect(() => {
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
            setCurrentUser({
              name: profile.full_name || 'User',
              email: profile.email || session.user.email || '',
              role: profile.role || 'admin'
            });
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
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/platform-connections');
      if (response.ok) {
        const data = await response.json();
        setConnectedPlatforms(data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching platform connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/platform-connections/assets');
      if (response.ok) {
        const data = await response.json();
        // Transform the data into recent activity format
        const activities = data.connections?.map((connection: any) => ({
          id: connection.id,
          type: 'platform_connection',
          title: `Connected to ${connection.name}`,
          description: `Platform: ${connection.platform}`,
          timestamp: new Date(connection.connectedAt).toISOString(),
          icon: 'Globe'
        })) || [];
        
        // Add some mock recent activities for demonstration
        const mockActivities = [
          {
            id: '1',
            type: 'link_generated',
            title: 'New onboarding link created',
            description: 'Link for Meta and Google platforms',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            icon: 'LinkIcon'
          },
          {
            id: '2',
            type: 'client_connected',
            title: 'Client completed onboarding',
            description: 'John Doe connected their platforms',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            icon: 'Users'
          },
          {
            id: '3',
            type: 'platform_connected',
            title: 'Meta platform connected',
            description: 'Facebook Business account linked',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
            icon: 'Globe'
          }
        ];
        
        setRecentActivity([...mockActivities, ...activities].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  useEffect(() => {
    if (settingsOpen) {
      fetchConnections();
    }
    if (notificationsOpen) {
      fetchRecentActivity();
    }
  }, [settingsOpen, notificationsOpen]);

  // Listen for custom event to open settings
  useEffect(() => {
    const handleOpenSettings = () => {
      setSettingsOpen(true);
    };
    
    window.addEventListener('openSettings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  // Fetch recent activity on component mount
  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const isPlatformConnected = (platformId: string) => {
    return connectedPlatforms.some(p => p.id === platformId);
  };

  const getPlatformLogo = (platformId: string) => {
    const logoMap: { [key: string]: string } = {
      'meta': '/logos/meta.png',
      'facebook': '/logos/meta.png',
      'google': '/logos/google.png',
      'tiktok': '/logos/tiktok.webp',
      'shopify': '/logos/shopify.png',
    };

    const logoPath = logoMap[platformId.toLowerCase()];
    
    if (logoPath) {
      return (
        <Image 
          src={logoPath} 
          alt={platformId} 
          width={28} 
          height={28}
          className="object-contain"
        />
      );
    }
    
    return <Globe className="h-6 w-6" />;
  };

  const getPlatformColor = (platformId: string) => {
    switch (platformId) {
      case 'meta': return 'bg-blue-600';
      case 'google': return 'bg-red-600';
      case 'tiktok': return 'bg-black';
      default: return 'bg-gray-600';
    }
  };
  
  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/links', label: 'Links', icon: LinkIcon },
    { href: '/admin/clients', label: 'Clients', icon: Users },
  ];
  
  const clientNavItems = [
    { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/connections', label: 'Connections', icon: LinkIcon },
  ];
  
  const navItems = role === 'admin' ? adminNavItems : clientNavItems;

  return (
        <header className="sticky top-0 z-40 flex h-20 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
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
        <nav className="hidden md:flex items-center justify-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => {
            const Icon = item.icon;
              const isActive = pathname === item.href;
            
              return (
              <Link key={item.href} href={item.href}>
                <div className="relative px-4 py-2 group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-500")} />
                    <span className={cn("text-base font-medium", isActive ? "text-primary" : "text-gray-500")}>{item.label}</span>
                  </div>
                  <div 
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                  />
                </div>
                </Link>
              );
            })}
          </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4 w-48 justify-end">
          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {recentActivity.length > 0 && (
            <Badge 
              variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
                    {recentActivity.length}
            </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Recent Activity</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fetchRecentActivity()}
                  className="h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
          </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  recentActivity.map((activity, index) => {
                    const Icon = activity.icon === 'LinkIcon' ? LinkIcon : 
                                activity.icon === 'Users' ? Users : Globe;
                    const timeAgo = new Date(activity.timestamp).toLocaleString();
                    
                    return (
                      <div key={activity.id} className="p-3 hover:bg-accent/50">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                          </div>
                        </div>
                        {index < recentActivity.length - 1 && (
                          <div className="mt-2 border-b border-border/50" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-auto px-3 rounded-full flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-sm font-medium">
                  {currentUser?.name || user?.name || 'Guest User'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentUser?.name || user?.name || 'Guest User'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email || user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-[80vw] h-[80vh] !max-w-[80vw] overflow-y-auto p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="platforms" className="w-full flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 px-6">
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            {/* Platform Connections Tab */}
            <TabsContent value="platforms" className="space-y-4 p-6 flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Platform Connections</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {platforms.map((platform) => {
                        const isConnected = isPlatformConnected(platform.id);
                        return (
                          <div key={platform.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg">
                                  {getPlatformLogo(platform.id)}
                                </div>
                                <div>
                                  <h3 className="font-medium text-sm">{platform.name}</h3>
                                  {isConnected && (
              <p className="text-xs text-gray-500">
                                      Connected as {connectedPlatforms.find(p => p.id === platform.id)?.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isConnected ? (
                                  <>
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Connected
                                    </Badge>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/admin/platform-connections/${platform.id}`, {
                                            method: 'DELETE',
                                          });
                                          if (response.ok) {
                                            setConnectedPlatforms(prev => prev.filter(conn => conn.id !== platform.id));
                                          }
                                        } catch (error) {
                                          console.error('Error disconnecting platform:', error);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      const oauthUrl = platform.id === 'meta' 
                                        ? `/api/oauth/admin/connect/meta`
                                        : platform.id === 'google'
                                        ? `/api/oauth/admin/connect/google`
                                        : `/api/oauth/admin/connect/${platform.id}`;
                                      window.location.href = oauthUrl;
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Connect
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              <div className="flex flex-wrap gap-1">
                                {platform.permissions.slice(0, 3).map((permission) => (
                                  <Badge key={permission.id} variant="secondary" className="text-xs">
                                    {permission.name}
                                  </Badge>
                                ))}
                                {platform.permissions.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{platform.permissions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 p-6 flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>General Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="platform-name">Platform Name</Label>
                      <Input id="platform-name" defaultValue="VAST Onboarding Platform" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="default-expiry">Default Link Expiry (days)</Label>
                      <Input id="default-expiry" type="number" defaultValue="7" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@vast.com" className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Section within General Tab */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email alerts for new requests</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="link-expiry-alerts">Link Expiry Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when links are about to expire</p>
                    </div>
                    <Switch id="link-expiry-alerts" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-reports">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                    </div>
                    <Switch id="weekly-reports" />
                  </div>
                </CardContent>
              </Card>

              {/* Security Section within General Tab */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require-2fa">Require 2FA</Label>
                      <p className="text-sm text-muted-foreground">Enforce two-factor authentication for all users</p>
                    </div>
                    <Switch id="require-2fa" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="session-timeout">Auto-logout after inactivity</Label>
                      <p className="text-sm text-muted-foreground">Automatically log out users after 30 minutes of inactivity</p>
                    </div>
                    <Switch id="session-timeout" defaultChecked />
            </div>
                  <div>
                    <Label htmlFor="allowed-domains">Allowed Domains</Label>
                    <Input id="allowed-domains" placeholder="example.com, client.com" className="mt-1" />
                    <p className="text-sm text-muted-foreground mt-1">Comma-separated list of allowed email domains</p>
              </div>
                </CardContent>
              </Card>
            </TabsContent>

            
          </Tabs>

          <div className="flex justify-end px-6 pb-6">
            <Button className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
