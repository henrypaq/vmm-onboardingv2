import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Bell, Shield, Globe, Users, Search, Video, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';

export default function AdminSettingsPage() {
  const platforms = getAllPlatforms();
  
  // Mock connected platforms - replace with real data from API
  const connectedPlatforms = [
    { id: 'meta', name: 'Meta (Facebook)', username: 'admin@company.com', status: 'connected' },
    { id: 'google', name: 'Google', username: 'admin@company.com', status: 'connected' },
  ];

  const getPlatformIcon = (platformId: string) => {
    switch (platformId) {
      case 'meta': return <Users className="h-5 w-5" />;
      case 'google': return <Search className="h-5 w-5" />;
      case 'tiktok': return <Video className="h-5 w-5" />;
      case 'shopify': return <ShoppingBag className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platformId: string) => {
    switch (platformId) {
      case 'meta': return 'bg-blue-600';
      case 'google': return 'bg-red-600';
      case 'tiktok': return 'bg-black';
      case 'shopify': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
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
              {platforms.map((platform) => {
                const isConnected = connectedPlatforms.some(p => p.id === platform.id);
                return (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getPlatformColor(platform.id)} text-white`}>
                          {getPlatformIcon(platform.id)}
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
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" className="flex items-center space-x-2">
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
