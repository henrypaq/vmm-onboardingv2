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
import { scopes, getScopesForProvider, getScopeDescription } from '@/lib/scopes';

interface EnhancedLinkGeneratorFormProps {
  onLinkGenerated: (link: { url: string; token: string; platforms: string[]; permissions: Record<string, string[]> }) => void;
}

export function EnhancedLinkGeneratorForm({ onLinkGenerated }: EnhancedLinkGeneratorFormProps) {
  const [clientId, setClientId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<Record<string, string[]>>({});
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
      // Initialize with basic scopes for this platform
      const availableScopes = getScopesForProvider(platformId as keyof typeof scopes);
      if (availableScopes.length > 0) {
        // Select the first scope by default (usually the basic one)
        setSelectedScopes(prev => ({
          ...prev,
          [platformId]: [availableScopes[0]]
        }));
      }
    } else {
      setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
      setSelectedScopes(prev => {
        const newScopes = { ...prev };
        delete newScopes[platformId];
        return newScopes;
      });
    }
  };

  const handleScopeToggle = (platformId: string, scope: string, checked: boolean) => {
    setSelectedScopes(prev => ({
      ...prev,
      [platformId]: checked
        ? [...(prev[platformId] || []), scope]
        : (prev[platformId] || []).filter(s => s !== scope)
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
          requestedScopes: selectedScopes,
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
        permissions: selectedScopes
      });
      
      // Reset form
      setClientId('');
      setExpiresInDays(7);
      setSelectedPlatforms([]);
      setSelectedScopes({});
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
                          {getScopesForProvider(platform.id as keyof typeof scopes).length} scopes available
                        </p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="ml-8 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Select OAuth Scopes:</p>
                        {getScopesForProvider(platform.id as keyof typeof scopes).map((scope) => {
                          const isScopeSelected = selectedScopes[platform.id]?.includes(scope) || false;
                          return (
                            <div key={scope} className="flex items-start space-x-2">
                              <Checkbox
                                id={`scope-${platform.id}-${scope}`}
                                checked={isScopeSelected}
                                onCheckedChange={(checked) => 
                                  handleScopeToggle(platform.id, scope, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <label 
                                  htmlFor={`scope-${platform.id}-${scope}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {scope}
                                </label>
                                <p className="text-xs text-gray-500">
                                  {getScopeDescription(platform.id as keyof typeof scopes, scope)}
                                </p>
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
                  <span className="font-medium">Total Scopes:</span> {
                    Object.values(selectedScopes).reduce((total, scopes) => total + scopes.length, 0)
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
