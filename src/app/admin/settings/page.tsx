'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Bell, Shield, Globe } from 'lucide-react';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';
import { OAuthConnectionCard } from '@/components/oauth/oauth-connection-card';
// Removed direct database import - using API route instead

export default function AdminSettingsPage() {
  const platforms = getAllPlatforms();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load connected platforms on component mount
  useEffect(() => {
    const loadConnectedPlatforms = async () => {
      try {
        const response = await fetch('/api/admin/platform-connections');
        if (response.ok) {
          const data = await response.json();
          setConnectedPlatforms(data.connections.map((conn: any) => conn.platform));
        } else {
          console.error('Failed to load platform connections');
        }
      } catch (error) {
        console.error('Error loading platform connections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnectedPlatforms();
  }, []);

  const handleConnect = (platformId: string) => {
    // Redirect to OAuth flow
    window.location.href = `/api/oauth/admin/connect/${platformId}`;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <OAuthConnectionCard
                  key={platform.id}
                  platform={platform}
                  isConnected={connectedPlatforms.includes(platform.id)}
                  onConnect={handleConnect}
                  isLoading={isLoading}
                />
              ))}
            </div>
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
