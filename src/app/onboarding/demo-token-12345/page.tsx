'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, ExternalLink, Users, Search, Video, ShoppingBag, Shield, Info } from 'lucide-react';
import { getAllPlatforms, getPlatformDefinition } from '@/lib/platforms/platform-definitions';
import { scopes, getScopeDescription } from '@/lib/scopes';

const platforms = getAllPlatforms();

// Add Shopify as a special case
const allPlatforms = [...platforms, {
  id: 'shopify',
  name: 'Shopify',
  icon: 'ShoppingBag',
  color: 'bg-green-600',
  permissions: [
    {
      id: 'store_access',
      name: 'Store Access',
      description: 'Access to your Shopify store data',
      required: true,
      category: 'E-commerce',
    }
  ],
  oauthScopes: [],
  isSpecial: true
}];

export default function DemoOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [shopifyData, setShopifyData] = useState({
    storeId: '',
    collaboratorCode: ''
  });
  const [shopifyStep, setShopifyStep] = useState(1); // 1 = store ID, 2 = permissions
  const [linkData, setLinkData] = useState<{
    platforms: string[];
    requestedScopes: Record<string, string[]>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch link data on component mount
  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        // For demo purposes, we'll use a mock token
        // In production, this would come from the URL params
        const token = 'demo-token-12345';
        
        // Mock data for demo - in production, fetch from API
        const mockLinkData = {
          platforms: ['google', 'meta'],
          requestedScopes: {
            google: ['openid email profile'],
            meta: ['pages_show_list']
          }
        };
        
        setLinkData(mockLinkData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching link data:', error);
        setIsLoading(false);
      }
    };

    fetchLinkData();
  }, []);

  const handlePermissionChange = (platformId: string, permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [platformId]: checked 
        ? [...(prev[platformId] || []), permissionId]
        : (prev[platformId] || []).filter(id => id !== permissionId)
    }));
  };

  const handleConnectPlatform = (platformId: string) => {
    // Get the scopes for this platform from the link data
    const platformScopes = linkData?.requestedScopes[platformId] || [];
    
    if (platformScopes.length === 0) {
      console.error('No scopes found for platform:', platformId);
      return;
    }

    // Build OAuth URL with the stored scopes
    let oauthUrl = '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
    
    if (platformId === 'google') {
      const scopesParam = platformScopes.join(' ');
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/oauth/client/connect/google`)}&scope=${encodeURIComponent(scopesParam)}&response_type=code&state=client_${Date.now()}`;
    } else if (platformId === 'meta') {
      const scopesParam = platformScopes.join(',');
      oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/oauth/client/connect/meta`)}&scope=${encodeURIComponent(scopesParam)}&response_type=code&state=client_${Date.now()}`;
    }
    
    if (oauthUrl) {
      // Redirect to OAuth provider
      window.location.href = oauthUrl;
    } else {
      // For other platforms or if no OAuth URL, just mark as connected
    setConnectedPlatforms(prev => ({
      ...prev,
      [platformId]: true
    }));
    
      // Auto-select the scopes that were requested for this platform
      setSelectedPermissions(prev => ({
        ...prev,
        [platformId]: platformScopes
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < requestedPlatforms.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsCompleted(true);
  };

  const currentPlatform = requestedPlatforms[currentStep];
  const isConnected = connectedPlatforms[currentPlatform.id];
  const hasRequiredPermissions = currentPlatform.permissions
    .filter(p => p.required)
    .every(p => selectedPermissions[currentPlatform.id]?.includes(p.id));

  const getPlatformIcon = (platformId: string) => {
    switch (platformId) {
      case 'meta': return <Users className="h-8 w-8" />;
      case 'google': return <Search className="h-8 w-8" />;
      case 'tiktok': return <Video className="h-8 w-8" />;
      case 'shopify': return <ShoppingBag className="h-8 w-8" />;
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

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Integration Complete!</CardTitle>
            <CardDescription>
              Thank you for connecting your platforms. Your onboarding request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You will receive an email confirmation once your request has been reviewed by our team.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter platforms to only show those requested in the link
  const requestedPlatforms = linkData ? 
    allPlatforms.filter(platform => linkData.platforms.includes(platform.id)) : 
    allPlatforms;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="text-center">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors duration-200 cursor-pointer"
            >
              VAST
            </button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {requestedPlatforms.map((platform, index) => (
              <div key={platform.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    index <= currentStep 
                      ? index === currentStep 
                        ? 'bg-purple-600' 
                        : 'bg-green-600'
                      : 'bg-gray-300'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-sm font-medium mt-2 ${
                    index <= currentStep 
                      ? index === currentStep 
                        ? 'text-purple-600' 
                        : 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    {platform.name}
                  </span>
                </div>
                {index < allPlatforms.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${getPlatformColor(currentPlatform.id)} text-white mb-6`}>
            {getPlatformIcon(currentPlatform.id)}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentPlatform.name} Integration
          </h2>
          <p className="text-gray-600">
            Connect your {currentPlatform.name} account to grant access permissions
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            {currentPlatform.id === 'shopify' ? (
              <div>
                {shopifyStep === 1 ? (
                  // Step 1: Store ID Entry
                  <div>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Shopify Store Connection
                      </h3>
                      <p className="text-gray-600">
                        Enter your Shopify store ID to get started
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="shopify-store-id" className="block text-sm font-medium text-gray-700 mb-2">
                          Shopify Store ID
                        </label>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            https://
                          </span>
                          <input
                            type="text"
                            id="shopify-store-id"
                            value={shopifyData.storeId}
                            onChange={(e) => setShopifyData(prev => ({ ...prev, storeId: e.target.value }))}
                            placeholder="your-store-id"
                            className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            .myshopify.com
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Info className="h-4 w-4 mr-1" />
                          <a href="#" className="text-purple-600 hover:text-purple-500">
                            How to find your store ID
                          </a>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">Secure Connection</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Your store credentials are encrypted and stored securely. You can revoke access at any time.
                        </p>
                      </div>

                      <Button 
                        onClick={() => setShopifyStep(2)}
                        disabled={!shopifyData.storeId}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        <span>Continue</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Step 2: Permissions Setup
                  <div>
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            1
                          </div>
                          <div className="w-16 h-0.5 bg-purple-600"></div>
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                            2
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        2 more steps needed to finish granting everything
                      </h3>
                      <p className="text-gray-600">
                        First, to grant access to your Shopify Store &apos;{shopifyData.storeId}&apos;, follow these simple instructions:
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            1
                          </div>
                          <span className="font-medium text-gray-900">Assign your Shopify Store &apos;{shopifyData.storeId}&apos;</span>
                        </div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                            2
                          </div>
                          <span className="font-medium text-gray-600">Assign your WordPress Site &apos;https://www.growth-consultant.com&apos;</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-3">
                            1. Open your store&apos;s Users and permissions settings:
                          </p>
                          <Button 
                            onClick={() => window.open(`https://${shopifyData.storeId}.myshopify.com/admin/settings/users`, '_blank')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium"
                          >
                            OPEN SHOPIFY
                          </Button>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-3">
                            2. Enter your Collaborator Request Code
                          </p>
                          <div>
                            <label htmlFor="collaborator-code" className="block text-sm font-medium text-gray-700 mb-2">
                              Collaborator Request Code
                            </label>
                            <input
                              type="text"
                              id="collaborator-code"
                              value={shopifyData.collaboratorCode}
                              onChange={(e) => setShopifyData(prev => ({ ...prev, collaboratorCode: e.target.value }))}
                              placeholder="Enter your collaborator code"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <Info className="h-4 w-4 mr-1" />
                              <span>Note: if no code is required enter &apos;none&apos;</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => setShopifyStep(1)}
                          variant="outline"
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button 
                          onClick={() => handleConnectPlatform('shopify')}
                          disabled={!shopifyData.collaboratorCode}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : !isConnected ? (
              <div className="text-center">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Connect to {currentPlatform.name}
                  </h3>
                  <p className="text-gray-600">
                    Click the button below to securely connect your {currentPlatform.name} account
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Secure Connection</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your credentials are encrypted and stored securely. You can revoke access at any time.
                  </p>
                </div>

                <Button 
                  onClick={() => handleConnectPlatform(currentPlatform.id)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Connect to {currentPlatform.name}</span>
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Connected Successfully</h3>
                      <p className="text-sm text-gray-600">Your {currentPlatform.name} account is connected</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Grant Access Permissions</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    The following permissions will be requested for this integration
                  </p>
                  
                  <div className="space-y-3">
                    {linkData?.requestedScopes[currentPlatform.id]?.map((scope) => {
                      const isSelected = selectedPermissions[currentPlatform.id]?.includes(scope) || false;
                      return (
                        <div key={scope} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={scope}
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(currentPlatform.id, scope, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <label 
                                htmlFor={scope}
                                className="font-medium text-gray-900 cursor-pointer"
                              >
                                {scope}
                              </label>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {getScopeDescription(currentPlatform.id as keyof typeof scopes, scope)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!isConnected || !hasRequiredPermissions || isSubmitting}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : currentStep === platforms.length - 1 ? (
              <>
                <span>Complete Setup</span>
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}