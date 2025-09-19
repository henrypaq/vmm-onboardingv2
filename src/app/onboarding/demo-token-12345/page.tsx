'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, ExternalLink, Users, Search, Video, ShoppingBag, Shield, Info } from 'lucide-react';
import { getAllPlatforms, getPlatformDefinition } from '@/lib/platforms/platform-definitions';

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

  const handlePermissionChange = (platformId: string, permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [platformId]: checked 
        ? [...(prev[platformId] || []), permissionId]
        : (prev[platformId] || []).filter(id => id !== permissionId)
    }));
  };

  const handleConnectPlatform = (platformId: string) => {
    setConnectedPlatforms(prev => ({
      ...prev,
      [platformId]: true
    }));
    
    // Auto-select required permissions when connecting
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
  };

  const handleNext = () => {
    if (currentStep < allPlatforms.length - 1) {
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

  const currentPlatform = allPlatforms[currentStep];
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">VAST</h1>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {allPlatforms.map((platform, index) => (
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
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Shopify Store Connection
                  </h3>
                  <p className="text-gray-600">
                    Enter your Shopify store details to connect your account
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

                  <div>
                    <label htmlFor="collaborator-code" className="block text-sm font-medium text-gray-700 mb-2">
                      Collaborator Code
                    </label>
                    <input
                      type="text"
                      id="collaborator-code"
                      value={shopifyData.collaboratorCode}
                      onChange={(e) => setShopifyData(prev => ({ ...prev, collaboratorCode: e.target.value }))}
                      placeholder="Enter your collaborator code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                    <div className="mt-2">
                      <a 
                        href="https://help.shopify.com/en/manual/your-account/access-tokens" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-500"
                      >
                        Get your collaborator code →
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
                    onClick={() => handleConnectPlatform('shopify')}
                    disabled={!shopifyData.storeId || !shopifyData.collaboratorCode}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span>Continue</span>
                  </Button>
                </div>
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
                    Select the permissions you want to grant for this integration
                  </p>
                  
                  <div className="space-y-3">
                    {currentPlatform.permissions.map((permission) => {
                      const isSelected = selectedPermissions[currentPlatform.id]?.includes(permission.id) || false;
                      return (
                        <div key={permission.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={permission.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(currentPlatform.id, permission.id, checked as boolean)
                            }
                            disabled={permission.required}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <label 
                                htmlFor={permission.id}
                                className="font-medium text-gray-900 cursor-pointer"
                              >
                                {permission.name}
                              </label>
                              {permission.required && (
                                <Badge variant="secondary" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {permission.description}
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