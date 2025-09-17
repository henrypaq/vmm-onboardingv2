'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Video, ShoppingBag } from 'lucide-react';
import { getAllPlatforms, getPlatformDefinition } from '@/lib/platforms/platform-definitions';

interface EnhancedLinkGeneratorFormProps {
  onLinkGenerated: (link: { url: string; token: string; platforms: string[]; permissions: Record<string, string[]> }) => void;
}

export function EnhancedLinkGeneratorForm({ onLinkGenerated }: EnhancedLinkGeneratorFormProps) {
  const [clientId, setClientId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const platforms = getAllPlatforms();

  const getPlatformIcon = (platformId: string) => {
    switch (platformId) {
      case 'meta': return <Users className="h-5 w-5" />;
      case 'google': return <Search className="h-5 w-5" />;
      case 'tiktok': return <Video className="h-5 w-5" />;
      case 'shopify': return <ShoppingBag className="h-5 w-5" />;
      default: return null;
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

  const handlePlatformToggle = (platformId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platformId]);
      // Initialize permissions for this platform
      const platform = getPlatformDefinition(platformId);
      if (platform) {
        const requiredPermissions = platform.permissions
          .filter(p => p.required)
          .map(p => p.id);
        setSelectedPermissions(prev => ({
          ...prev,
          [platformId]: requiredPermissions
        }));
      }
    } else {
      setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
      setSelectedPermissions(prev => {
        const newPermissions = { ...prev };
        delete newPermissions[platformId];
        return newPermissions;
      });
    }
  };

  const handlePermissionToggle = (platformId: string, permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [platformId]: checked
        ? [...(prev[platformId] || []), permissionId]
        : (prev[platformId] || []).filter(id => id !== permissionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch('/api/links/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          expiresInDays,
          platforms: selectedPlatforms,
          requestedPermissions: selectedPermissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const data = await response.json();
      onLinkGenerated({ 
        url: data.url, 
        token: data.link.token,
        platforms: selectedPlatforms,
        permissions: selectedPermissions
      });
      
      // Reset form
      setClientId('');
      setExpiresInDays(7);
      setSelectedPlatforms([]);
      setSelectedPermissions({});
    } catch (error) {
      console.error('Error generating link:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Onboarding Link</CardTitle>
        <CardDescription>
          Create a unique, expiring link for client onboarding with specific platform permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter client ID"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="expiresInDays">Expires in (days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                max="30"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <Label className="text-base font-medium">Select Platforms</Label>
            <p className="text-sm text-gray-500 mb-4">Choose which platforms to request access for</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Checkbox
                        id={`platform-${platform.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked as boolean)}
                      />
                      <div className={`p-2 rounded-lg ${getPlatformColor(platform.id)} text-white`}>
                        {getPlatformIcon(platform.id)}
                      </div>
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        <p className="text-sm text-gray-500">
                          {platform.permissions.length} permissions available
                        </p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="ml-8 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Select Permissions:</p>
                        {platform.permissions.map((permission) => {
                          const isPermissionSelected = selectedPermissions[platform.id]?.includes(permission.id) || false;
                          return (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`permission-${platform.id}-${permission.id}`}
                                checked={isPermissionSelected}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(platform.id, permission.id, checked as boolean)
                                }
                                disabled={permission.required}
                              />
                              <div className="flex-1">
                                <label 
                                  htmlFor={`permission-${platform.id}-${permission.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permission.name}
                                  {permission.required && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </label>
                                <p className="text-xs text-gray-500">{permission.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {selectedPlatforms.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Link Summary</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Platforms:</span> {selectedPlatforms.length} selected
                </p>
                <p className="text-sm">
                  <span className="font-medium">Total Permissions:</span> {
                    Object.values(selectedPermissions).reduce((total, perms) => total + perms.length, 0)
                  } requested
                </p>
                <p className="text-sm">
                  <span className="font-medium">Expires:</span> {expiresInDays} days
                </p>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isGenerating || selectedPlatforms.length === 0} 
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
