'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';
import { getScopeDescription, scopes } from '@/lib/scopes';
import { ArrowRight, ArrowLeft, ExternalLink, CheckCircle, Users, Search, Video, ShoppingBag } from 'lucide-react';

interface OnboardingFormProps {
  token: string;
  onSubmissionComplete: (requestId: string) => void;
}

interface LinkData {
  platforms: string[];
  requestedScopes: Record<string, string[]>;
  linkName?: string;
}

// Platform icons and colors (matching demo)
const getPlatformIcon = (platformId: string) => {
  switch (platformId) {
    case 'meta': return <Users className="h-8 w-8" />;
    case 'google': return <Search className="h-8 w-8" />;
    case 'tiktok': return <Video className="h-8 w-8" />;
    case 'shopify': return <ShoppingBag className="h-8 w-8" />;
    default: return <Users className="h-8 w-8" />;
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

export function EnhancedOnboardingForm({ token, onSubmissionComplete }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyStep, setShopifyStep] = useState(1);
  const [shopifyData, setShopifyData] = useState({
    storeId: '',
    collaboratorCode: ''
  });

  const allPlatforms = getAllPlatforms();

  // Load link data and handle OAuth redirects
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, fetch the link data to get requested platforms and scopes
        const linkResponse = await fetch(`/api/links/validate?token=${token}`);
        if (linkResponse.ok) {
          const linkData = await linkResponse.json();
          console.log('[Onboarding] Loaded link data', {
            token,
            platforms: linkData.platforms,
            requested_permissions: linkData.requested_permissions
          });
          setLinkData({
            platforms: linkData.platforms || [],
            requestedScopes: linkData.requested_permissions || {}
          });
          
          // Initialize selected permissions with requested scopes
          setSelectedPermissions(linkData.requested_permissions || {});
        }

        // Handle OAuth redirect parameters
        const urlParams = new URLSearchParams(window.location.search);
        const connected = urlParams.get('connected');
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        const step = urlParams.get('step');
        console.log('[Onboarding] URL params', { connected, success, error, step });
        
        if (connected && success === 'true') {
          // Mark platform as connected
          setConnectedPlatforms(prev => ({
            ...prev,
            [connected]: true
          }));
          
          // Advance to the next step if step parameter is provided
          if (step) {
            const nextStep = parseInt(step, 10);
            if (!isNaN(nextStep) && nextStep > 0) {
              console.log('[Onboarding] Advancing to step', nextStep);
              setCurrentStep(nextStep);
            }
          }
          
          // Clean up URL parameters
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('connected');
          newUrl.searchParams.delete('success');
          newUrl.searchParams.delete('step');
          newUrl.searchParams.delete('username');
          window.history.replaceState({}, '', newUrl.toString());
        } else if (error) {
          console.error('OAuth error:', error);
          // Handle OAuth errors if needed
        }

        // Load existing onboarding request data if it exists
        const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
        if (requestResponse.ok) {
          const data = await requestResponse.json();
          if (data.request) {
            setFormData({
              name: data.request.client_name || '',
              email: data.request.client_email || '',
              company: data.request.company_name || '',
            });
            
            // Load existing connected platforms
            if (data.request.platform_connections) {
              const connected: Record<string, boolean> = {};
              data.request.platform_connections.forEach((conn: { platform: string }) => {
                connected[conn.platform] = true;
              });
              setConnectedPlatforms(connected);
            }
          }
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (platformId: string, permission: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [platformId]: checked
        ? [...(prev[platformId] || []), permission]
        : (prev[platformId] || []).filter(id => id !== permission)
    }));
  };

  const handleConnectPlatform = (platformId: string) => {
    // Redirect to OAuth flow
    console.log('[Onboarding] Initiating OAuth for', { platformId, token });
    window.location.href = `/api/oauth/client/connect/${platformId}?token=${token}`;
  };

  const handleShopifyStoreIdSubmit = () => {
    if (shopifyData.storeId.trim()) {
      setShopifyStep(2);
    }
  };

  const handleShopifyComplete = () => {
    setConnectedPlatforms(prev => ({
      ...prev,
      shopify: true
    }));
    setShopifyStep(1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          client_name: formData.name,
          client_email: formData.email,
          company_name: formData.company,
          platform_connections: Object.keys(connectedPlatforms).filter(platform => connectedPlatforms[platform]),
          requested_permissions: selectedPermissions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onSubmissionComplete(data.requestId);
      } else {
        console.error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting onboarding request:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Filter platforms to only show requested ones
  const requestedPlatforms = linkData ? 
    allPlatforms.filter(platform => linkData.platforms.includes(platform.id)) : 
    allPlatforms;

  const getTotalSteps = () => {
    return requestedPlatforms.length + 1; // +1 for personal info step
  };

  const currentPlatform = requestedPlatforms[currentStep - 1]; // -1 because step 0 is personal info
  const isConnected = currentPlatform ? connectedPlatforms[currentPlatform.id] : false;
  
  // Check if we have the requested scopes selected
  const requestedScopes = currentPlatform ? (linkData?.requestedScopes[currentPlatform.id] || []) : [];
  const hasRequiredPermissions = requestedScopes.length === 0 || 
    requestedScopes.every(scope => selectedPermissions[currentPlatform?.id || '']?.includes(scope));

  // For the final step, check if ALL platforms are connected and have required permissions
  const allPlatformsConnected = requestedPlatforms.every(platform => connectedPlatforms[platform.id]);
  const allPlatformsHavePermissions = requestedPlatforms.every(platform => {
    const platformScopes = linkData?.requestedScopes[platform.id] || [];
    return platformScopes.length === 0 || 
      platformScopes.every(scope => selectedPermissions[platform.id]?.includes(scope));
  });
  const isFinalStepComplete = allPlatformsConnected && allPlatformsHavePermissions;

  // Debug logging for final step
  if (currentStep === getTotalSteps() - 1) {
    console.log('[Onboarding] Final step debug:', {
      currentStep,
      totalSteps: getTotalSteps(),
      allPlatformsConnected,
      allPlatformsHavePermissions,
      isFinalStepComplete,
      connectedPlatforms,
      selectedPermissions,
      requestedPlatforms: requestedPlatforms.map(p => ({ id: p.id, scopes: linkData?.requestedScopes[p.id] || [] }))
    });
  }

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
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                currentStep === 0 ? 'bg-purple-600' : 'bg-green-600'
              }`}>
                {currentStep > 0 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  1
                )}
              </div>
              <span className={`text-sm font-medium mt-2 ${
                currentStep >= 0 ? 'text-purple-600' : 'text-gray-400'
              }`}>
                Personal Info
              </span>
            </div>
            
            {requestedPlatforms.map((platform, index) => (
              <>
                <div className={`w-16 h-0.5 ${
                  currentStep > index ? 'bg-green-600' : 'bg-gray-300'
                }`} />
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    currentStep === index + 1
                      ? 'bg-purple-600' 
                      : currentStep > index + 1
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`}>
                    {currentStep > index + 1 ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 2
                    )}
                  </div>
                  <span className={`text-sm font-medium mt-2 ${
                    currentStep >= index + 1 
                      ? currentStep === index + 1 
                        ? 'text-purple-600' 
                        : 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    {platform.name}
                  </span>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {currentStep === 0 ? (
          // Personal Information Step
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Personal Information
              </h2>
              <p className="text-gray-600">
                Please provide your contact information for this onboarding request.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Platform Connection Step
          <div>
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
                            Enter Your Shopify Store ID
                          </h3>
                          <p className="text-gray-600">
                            Provide your Shopify store ID to get the collaborator code link.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="storeId">Store ID</Label>
                            <Input
                              id="storeId"
                              value={shopifyData.storeId}
                              onChange={(e) => setShopifyData(prev => ({ ...prev, storeId: e.target.value }))}
                              placeholder="your-store-name"
                            />
                          </div>
                        </div>

                        <div className="flex space-x-4 mt-8">
                          <Button 
                            onClick={handleBack}
                            variant="outline"
                            className="flex-1"
                          >
                            Back
                          </Button>
                          <Button 
                            onClick={handleShopifyStoreIdSubmit}
                            disabled={!shopifyData.storeId.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Step 2: Collaborator Code Entry
                      <div>
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Get Your Collaborator Code
                          </h3>
                          <p className="text-gray-600">
                            Click the link below to get your collaborator code from Shopify.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="text-center">
                            <a 
                              href={`https://${shopifyData.storeId}.myshopify.com/admin/settings/users`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Open Shopify Users & Permissions</span>
                            </a>
                          </div>
                          
                          <div>
                            <Label htmlFor="collaboratorCode">Collaborator Code</Label>
                            <Input
                              id="collaboratorCode"
                              value={shopifyData.collaboratorCode}
                              onChange={(e) => setShopifyData(prev => ({ ...prev, collaboratorCode: e.target.value }))}
                              placeholder="Enter the collaborator code"
                            />
                          </div>
                        </div>

                        <div className="flex space-x-4 mt-8">
                          <Button 
                            onClick={() => setShopifyStep(1)}
                            variant="outline"
                            className="flex-1"
                          >
                            Back
                          </Button>
                          <Button 
                            onClick={handleShopifyComplete}
                            disabled={!shopifyData.collaboratorCode}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Complete
                          </Button>
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
                        Click the button below to securely connect your {currentPlatform.name} account.
                        This will redirect you to {currentPlatform.name} to authorize access.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
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
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Requested Permissions:</h4>
                      <div className="space-y-2">
                        {requestedScopes.map((scope) => {
                          const descriptionText = getScopeDescription(currentPlatform.id as keyof typeof scopes, scope);
                          const isSelected = selectedPermissions[currentPlatform.id]?.includes(scope) || false;
                          return (
                            <div key={scope} className="flex items-start space-x-3 p-3 border rounded-lg">
                              <Checkbox
                                id={`${currentPlatform.id}-${scope}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(currentPlatform.id, scope, checked as boolean)
                                }
                              />
                              <div className="space-y-1 flex-1">
                                <Label 
                                  htmlFor={`${currentPlatform.id}-${scope}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {scope}
                                </Label>
                                <p className="text-sm text-gray-500">
                                  {descriptionText}
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
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 max-w-2xl mx-auto">
          <div>
            {currentStep > 0 && (
              <Button 
                onClick={handleBack}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}
          </div>
          
          <div>
            {currentStep === getTotalSteps() - 1 ? (
              <Button 
                onClick={handleSubmit}
                disabled={!isFinalStepComplete}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Complete Access Grant</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={
                  currentStep === 0 
                    ? !formData.name.trim() || !formData.email.trim()
                    : !isConnected || !hasRequiredPermissions
                }
                className="flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}