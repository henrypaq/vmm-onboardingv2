'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe } from 'lucide-react';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';
import { scopes, getScopesForProvider, getScopeDescription, getAvailableScopesForProvider, getGoogleScopesWithRequired, getGoogleServiceName, metaAssetGroups, areAllSubScopesSelected } from '@/lib/scopes';

interface EnhancedLinkGeneratorFormProps {
  onLinkGenerated: (link: { url: string; token: string; platforms: string[]; requestedScopes: Record<string, string[]> }) => void;
}

export function EnhancedLinkGeneratorForm({ onLinkGenerated }: EnhancedLinkGeneratorFormProps) {
  const [linkName, setLinkName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<Record<string, string[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const platforms = getAllPlatforms();

  const getPlatformLogo = (platformId: string) => {
    const logoMap: { [key: string]: string } = {
      'meta': '/logos/meta.png',
      'facebook': '/logos/meta.png',
      'google': '/logos/google.png',
      'google analytics': '/logos/google.png',
      'google ads': '/logos/google.png',
      'tiktok': '/logos/tiktok.webp',
      'shopify': '/logos/shopify.png',
    };

    const logoPath = logoMap[platformId.toLowerCase()];
    
    if (logoPath) {
      return (
        <Image 
          src={logoPath} 
          alt={platformId} 
          width={24} 
          height={24}
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
      case 'shopify': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const handlePlatformToggle = (platformId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platformId]);
      // For Google, don't auto-select any scopes - let user choose
      // For other platforms, keep existing behavior
      if (platformId !== 'google') {
        const availableScopes = getAvailableScopesForProvider(platformId as keyof typeof scopes);
        if (availableScopes.length > 0) {
          setSelectedScopes(prev => ({
            ...prev,
            [platformId]: [availableScopes[0]]
          }));
        } else {
          console.warn(`No available scopes for platform: ${platformId}`);
          alert(`Warning: ${platformId} has no available scopes for testing. This platform will be skipped.`);
          return;
        }
      } else {
        // Initialize Google with empty scopes - user must select services
        setSelectedScopes(prev => ({
          ...prev,
          [platformId]: []
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

  const handleMetaAssetGroupToggle = (groupName: string, checked: boolean) => {
    const group = metaAssetGroups[groupName as keyof typeof metaAssetGroups];
    if (!group) return;

    setSelectedScopes(prev => {
      const currentScopes = prev.meta || [];
      let newScopes: string[];

      if (checked) {
        // Add all scopes from this group
        newScopes = [...new Set([...currentScopes, ...group.scopes])];
      } else {
        // Remove all scopes from this group
        newScopes = currentScopes.filter(scope => !group.scopes.includes(scope));
      }

      return {
        ...prev,
        meta: newScopes
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!linkName.trim()) {
      alert('Please enter a Link Name');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    
    // Validate that each selected platform has at least one scope (except Google which always has openid/email/profile)
    for (const platform of selectedPlatforms) {
      if (platform !== 'google' && (!selectedScopes[platform] || selectedScopes[platform].length === 0)) {
        alert(`Please select at least one scope for ${platform}`);
        return;
      }
    }
    
    console.log('Generating link with data:', {
      linkName,
      expiresInDays,
      platforms: selectedPlatforms,
      requestedScopes: selectedScopes
    });
    
    setIsGenerating(true);

    try {
      const response = await fetch('/api/links/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkName,
          expiresInDays,
          platforms: selectedPlatforms,
          requestedScopes: selectedScopes,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`Failed to generate link: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('Generated link data:', data);
      
      onLinkGenerated({ 
        url: data.url, 
        token: data.link.token,
        platforms: selectedPlatforms,
        requestedScopes: selectedScopes
      });
      
          // Reset form
          setLinkName('');
          setExpiresInDays(7);
          setSelectedPlatforms([]);
          setSelectedScopes({});
      
      alert('Link generated successfully!');
    } catch (error) {
      console.error('Error generating link:', error);
      alert(`Error generating link: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              <Label htmlFor="linkName">Link Name</Label>
              <Input
                id="linkName"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="Enter link name (e.g., 'Client Onboarding - Q1 2024')"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                A descriptive name to identify this onboarding link
              </p>
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
                const availableScopesCount = getAvailableScopesForProvider(platform.id as keyof typeof scopes).length;
                const isAvailable = availableScopesCount > 0;
                
                return (
                  <div key={platform.id} className={`border rounded-lg p-4 ${!isAvailable ? 'opacity-50 bg-gray-50' : ''}`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <Checkbox
                        id={`platform-${platform.id}`}
                        checked={isSelected}
                        disabled={!isAvailable}
                        onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked as boolean)}
                      />
                      <div className="p-2 rounded-lg">
                        {getPlatformLogo(platform.id)}
                      </div>
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        <p className="text-sm text-gray-500">
                          {isAvailable 
                            ? `${availableScopesCount} scopes available for testing`
                            : 'No scopes available for testing'
                          }
                        </p>
                        {!isAvailable && (
                          <p className="text-xs text-orange-600 mt-1">Coming Soon</p>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="ml-8 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Select OAuth Scopes:</p>
                        {platform.id === 'google' && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800 font-medium">
                              ✓ OpenID, Email, and Profile access will be automatically included for account identification
                            </p>
                          </div>
                        )}
                        {platform.id === 'meta' ? (
                          // Meta grouped asset structure
                          <div className="space-y-3">
                            {Object.entries(metaAssetGroups).map(([groupName, groupData]) => {
                              const isGroupSelected = areAllSubScopesSelected(groupName, selectedScopes[platform.id] || []);
                              const isGroupAvailable = groupData.available;
                              
                              return (
                                <div key={groupName} className="border rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <Checkbox
                                      id={`meta-group-${groupName}`}
                                      checked={isGroupSelected}
                                      onCheckedChange={(checked) => 
                                        handleMetaAssetGroupToggle(groupName, checked as boolean)
                                      }
                                    />
                                    <div className="flex-1">
                                      <label 
                                        htmlFor={`meta-group-${groupName}`}
                                        className="text-sm font-medium cursor-pointer"
                                      >
                                        {groupName}
                                      </label>
                                      
                                      {/* Show sub-options for Pages */}
                                      {groupName === 'Pages' && (
                                        <div className="mt-2 ml-6 space-y-1">
                                          {groupData.scopes.map((scope) => {
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
                                                    className="text-xs cursor-pointer"
                                                  >
                                                    {getScopeDescription(platform.id as keyof typeof scopes, scope)}
                                                  </label>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : platform.id === 'google' ? (
                          // Google grouped asset structure (similar to Meta)
                          <div className="space-y-3">
                            {getScopesForProvider(platform.id as keyof typeof scopes).map((scope) => {
                              const isScopeSelected = selectedScopes[platform.id]?.includes(scope) || false;
                              const isScopeAvailable = getAvailableScopesForProvider(platform.id as keyof typeof scopes).includes(scope);
                              
                              // Skip background scopes for Google (they're always included)
                              if (['openid', 'email', 'profile'].includes(scope)) {
                                return null;
                              }
                              
                              return (
                                <div key={scope} className="border rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
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
                                        {getGoogleServiceName(scope)}
                                      </label>
                                      <p className="text-xs text-gray-500">
                                        {getScopeDescription(platform.id as keyof typeof scopes, scope)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Other platforms (TikTok, Shopify, etc.)
                          <div className="space-y-3">
                            {getScopesForProvider(platform.id as keyof typeof scopes).map((scope) => {
                              const isScopeSelected = selectedScopes[platform.id]?.includes(scope) || false;
                              const isScopeAvailable = getAvailableScopesForProvider(platform.id as keyof typeof scopes).includes(scope);
                              
                              return (
                                <div key={scope} className={`flex items-start space-x-2 ${!isScopeAvailable ? 'opacity-50' : ''}`}>
                                  <Checkbox
                                    id={`scope-${platform.id}-${scope}`}
                                    checked={isScopeSelected}
                                    disabled={!isScopeAvailable}
                                    onCheckedChange={(checked) => 
                                      isScopeAvailable ? handleScopeToggle(platform.id, scope, checked as boolean) : undefined
                                    }
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={`scope-${platform.id}-${scope}`}
                                      className={`text-sm font-medium ${isScopeAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    >
                                      {scope}
                                      {!isScopeAvailable && (
                                        <span className="ml-2 text-xs text-orange-600 font-normal">(Coming Soon)</span>
                                      )}
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