'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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

export default function AdminSettingsPage() {
  const platforms = getAllPlatforms();
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Fetch platform connections from API
  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/admin/platform-connections');
      if (response.ok) {
        const data = await response.json();
        setConnectedPlatforms(data.connections || []);
      } else {
        console.error('Failed to fetch platform connections:', response.status);
        setConnectedPlatforms([]);
      }
    } catch (error) {
      console.error('Error fetching platform connections:', error);
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

    // If redirected from OAuth success, do a single refresh then clear URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') && urlParams.get('success')) {
      fetchConnections();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      const error = urlParams.get('error');
      const platform = urlParams.get('platform');
      const message = urlParams.get('message');
      console.error(`OAuth error for ${platform}: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [hasLoadedOnce]);

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
        <h1 className="text-3xl page-title text-gray-900">Settings</h1>
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
                return (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                          {getPlatformLogo(platform.id)}
                        </div>
                        <div>
                          <h3 className="font-medium">{platform.name}</h3>
                          {isConnected && (
                            <p className="text-sm text-gray-500">
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
                                  console.log(`Disconnecting ${platform.name}...`);
                                  const response = await fetch(`/api/admin/platform-connections/${platform.id}`, {
                                    method: 'DELETE',
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
                                    const errorData = await response.json();
                                    console.error('Failed to disconnect platform:', errorData);
                                    toast.error(`Failed to disconnect ${platform.name}: ${errorData.error || 'Unknown error'}`);
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
                            onClick={() => {
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
