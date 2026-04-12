'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Bell, Shield, Globe, Plus, Trash2 } from 'lucide-react';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';

interface PlatformConnection {
  id: string;
  name: string;
  username: string;
  status: string;
  platform: string;
  scopes: string[];
  connectedAt: string;
}

function AdminSettingsPageContent() {
  const platforms = getAllPlatforms();
  const searchParams = useSearchParams();
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Fetch platform connections from API
  const fetchConnections = async () => {
    try {
      console.log('🔄 Fetching platform connections...');
      const response = await fetch('/api/admin/platform-connections', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched connections:', data.connections);
        console.log('✅ Connection count:', data.connections?.length || 0);
        setConnectedPlatforms(data.connections || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch platform connections:', response.status, errorData);
        if (response.status === 401) {
          toast.error('Please log in to view platform connections');
        }
        setConnectedPlatforms([]);
      }
    } catch (error) {
      console.error('❌ Error fetching platform connections:', error);
      toast.error('Failed to load platform connections');
      setConnectedPlatforms([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  // Check if a platform is connected
  const isPlatformConnected = (platformId: string) => {
    return connectedPlatforms.some(p => p.id === platformId);
  };

  useEffect(() => {
    // First visit → load once
    if (!hasLoadedOnce) {
      fetchConnections();
    }
  }, [hasLoadedOnce]);

  // Separate effect to handle OAuth redirects - runs whenever search params change
  useEffect(() => {
    if (!searchParams) return;
    
    const connected = searchParams.get('connected');
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platform = searchParams.get('platform');
    const message = searchParams.get('message');
    const username = searchParams.get('username');

    console.log('🔍 Settings page URL params:', { connected, success, error, platform, message, username });

    if (connected && success) {
      console.log(`✅ OAuth success detected for ${connected}, refreshing connections...`);
      // Refresh connections after OAuth success
      fetchConnections().then(() => {
        console.log('✅ Connections refreshed after OAuth success');
        console.log('✅ Current connected platforms:', connectedPlatforms);
        // Show success message
        if (username) {
          toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully as ${decodeURIComponent(username)}!`);
        } else {
          toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
        }
        // Clear URL params after a short delay to ensure state is updated
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 100);
      }).catch((err) => {
        console.error('❌ Error refreshing connections after OAuth:', err);
        toast.error('Connection saved but failed to refresh UI. Please reload the page.');
      });
    } else if (error) {
      console.error(`❌ OAuth error for ${platform}: ${error}`);
      console.error(`❌ Error message: ${message || 'No message provided'}`);
      console.error(`❌ Full URL params:`, { connected, success, error, platform, message, username });
      if (message) {
        const decodedMessage = decodeURIComponent(message);
        console.error(`❌ Decoded error message: ${decodedMessage}`);
        toast.error(`Failed to connect ${platform}: ${decodedMessage}`, {
          duration: 10000, // Show for 10 seconds so user can read it
        });
      } else {
        toast.error(`Failed to connect ${platform || 'platform'}. Check console for details.`, {
          duration: 10000,
        });
      }
      // Clear URL params
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    }
  }, [searchParams]); // Watch for search param changes

  const getPlatformLogo = (platformId: string) => {
    const logoMap: { [key: string]: string } = {
      'meta': '/logos/meta.png',
      'facebook': '/logos/meta.png',
      'google': '/logos/google.png',
      'tiktok': '/logos/tiktok.webp',
      'shopify': '/logos/shopify.webp',
    };

    const logoPath = logoMap[platformId.toLowerCase()];
    
    if (logoPath) {
      return (
        <Image 
          src={logoPath} 
          alt={platformId} 
          width={32} 
          height={32}
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your platform configuration and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Platform Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Platform Connections</span>
            </CardTitle>
            <CardDescription>
              Connect your accounts to third-party platforms to generate onboarding links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading platform connections...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => {
                const isConnected = isPlatformConnected(platform.id);
                const isDisabled = platform.id === 'tiktok' || platform.id === 'shopify';
                return (
                  <div 
                    key={platform.id} 
                    className={`border rounded-lg p-4 ${isDisabled ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                          {getPlatformLogo(platform.id)}
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}>{platform.name}</h3>
                          {isConnected && (
                            <p className="text-sm text-gray-500">
                              Connected as {connectedPlatforms.find(p => p.id === platform.id)?.username}
                            </p>
                          )}
                          {isDisabled && (
                            <p className="text-sm text-gray-400 italic">Coming soon</p>
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
                                  console.log(`Disconnecting ${platform.name}...`);
                                  const response = await fetch(`/api/admin/platform-connections/${platform.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    console.log(`${platform.name} disconnected successfully:`, result);
                                    // Remove from local state
                                    setConnectedPlatforms(prev => 
                                      prev.filter(conn => conn.id !== platform.id)
                                    );
                                    // Show success message
                                    toast.success(`${platform.name} disconnected successfully!`);
                                  } else {
                                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                    console.error('Failed to disconnect platform:', errorData);
                                    if (response.status === 401) {
                                      toast.error('Please log in to disconnect platforms');
                                    } else {
                                      toast.error(`Failed to disconnect ${platform.name}: ${errorData.error || 'Unknown error'}`);
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error disconnecting platform:', error);
                                  toast.error(`Error disconnecting ${platform.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex items-center space-x-2"
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return;
                              
                              console.log(`Connecting to ${platform.name}...`);
                              console.log(`Platform ID: ${platform.id}`);
                              
                              // Use dedicated routes for better OAuth handling
                              const oauthUrl = platform.id === 'meta' 
                                ? `/api/oauth/admin/connect/meta`
                                : platform.id === 'google'
                                ? `/api/oauth/admin/connect/google`
                                : `/api/oauth/admin/connect/${platform.id}`;
                              
                              console.log(`OAuth URL: ${oauthUrl}`);
                              window.location.href = oauthUrl;
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Connect</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Available permissions:</p>
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
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>
              Configure basic platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  defaultValue="VAST Onboarding Platform"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="default-expiry">Default Link Expiry (days)</Label>
                <Input
                  id="default-expiry"
                  type="number"
                  defaultValue="7"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                defaultValue="support@vast.com"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email alerts for new requests</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="link-expiry-alerts">Link Expiry Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when links are about to expire</p>
              </div>
              <Switch id="link-expiry-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <p className="text-sm text-gray-500">Receive weekly summary reports</p>
              </div>
              <Switch id="weekly-reports" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>
              Configure security and access settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-2fa">Require 2FA</Label>
                <p className="text-sm text-gray-500">Enforce two-factor authentication for all users</p>
              </div>
              <Switch id="require-2fa" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session-timeout">Auto-logout after inactivity</Label>
                <p className="text-sm text-gray-500">Automatically log out users after 30 minutes of inactivity</p>
              </div>
              <Switch id="session-timeout" defaultChecked />
            </div>
            <div>
              <Label htmlFor="allowed-domains">Allowed Domains</Label>
              <Input
                id="allowed-domains"
                placeholder="example.com, client.com"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list of allowed email domains</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    }>
      <AdminSettingsPageContent />
    </Suspense>
  );
}
