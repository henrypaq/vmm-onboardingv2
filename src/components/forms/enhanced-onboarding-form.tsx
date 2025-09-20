'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientOAuthButton } from '@/components/oauth/client-oauth-button';
import { getAllPlatforms, getPlatformDefinition } from '@/lib/platforms/platform-definitions';
import { scopes, getScopeDescription } from '@/lib/scopes';
import { ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';

interface OnboardingFormProps {
  token: string;
  onSubmissionComplete: (requestId: string) => void;
}

export function EnhancedOnboardingForm({ token, onSubmissionComplete }: OnboardingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linkData, setLinkData] = useState<{
    platforms: string[];
    requestedScopes: Record<string, string[]>;
  } | null>(null);
  
  const allPlatforms = getAllPlatforms();

  // Load link data and existing onboarding request data
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, fetch the link data to get requested platforms and scopes
        const linkResponse = await fetch(`/api/links/validate?token=${token}`);
        if (linkResponse.ok) {
          const linkData = await linkResponse.json();
          setLinkData({
            platforms: linkData.platforms || [],
            requestedScopes: linkData.requested_permissions || {}
          });
          
          // Initialize selected permissions with requested scopes
          setSelectedPermissions(linkData.requested_permissions || {});
        }

        // Then, load existing onboarding request data if it exists
        const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
        if (requestResponse.ok) {
          const data = await requestResponse.json();
          if (data.request) {
            setFormData({
              name: data.request.client_name || '',
              email: data.request.client_email || '',
              company: data.request.company_name || '',
            });
            setConnectedPlatforms(Object.keys(data.request.platform_connections || {}));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (platformId: string, scope: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      const currentScopes = prev[platformId] || [];
      if (checked) {
        return {
          ...prev,
          [platformId]: [...currentScopes, scope]
        };
      } else {
        return {
          ...prev,
          [platformId]: currentScopes.filter(s => s !== scope)
        };
      }
    });
  };

  const handlePlatformConnect = (platformId: string) => {
    // Redirect to OAuth flow
    window.location.href = `/api/oauth/client/connect/${platformId}?token=${token}`;
  };

  // Filter platforms to only show requested ones
  const requestedPlatforms = linkData ? 
    allPlatforms.filter(platform => linkData.platforms.includes(platform.id)) : 
    [];

  const hasRequiredPermissions = (platformId: string) => {
    if (!linkData) return false;
    const requestedScopes = linkData.requestedScopes[platformId] || [];
    const selectedScopes = selectedPermissions[platformId] || [];
    return requestedScopes.every(scope => selectedScopes.includes(scope));
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.name && formData.email;
    }
    if (currentStep === 1) {
      return connectedPlatforms.length === requestedPlatforms.length;
    }
    if (currentStep === 2) {
      return requestedPlatforms.every(platform => hasRequiredPermissions(platform.id));
    }
    return false;
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          permissions: selectedPermissions,
          data: {
            ...formData,
            submittedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit onboarding request');
      }

      const data = await response.json();
      onSubmissionComplete(data.requestId);
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading onboarding flow...</div>
        </CardContent>
      </Card>
    );
  }

  if (!linkData) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">Failed to load onboarding data</div>
        </CardContent>
      </Card>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Please provide your contact information for this onboarding request.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Accounts</CardTitle>
              <CardDescription>
                Connect your accounts for the platforms that have requested access. You need to connect all platforms to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestedPlatforms.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded ${platform.color} flex items-center justify-center text-white text-sm font-medium`}>
                      {platform.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium">{platform.name}</h4>
                      <p className="text-sm text-gray-500">Connect your {platform.name} account</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {connectedPlatforms.includes(platform.id) ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handlePlatformConnect(platform.id)}
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Connect</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review Permissions</CardTitle>
              <CardDescription>
                Review and customize the permissions being requested. You can uncheck any permissions you don't want to grant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {requestedPlatforms.map((platform) => {
                  const requestedScopes = linkData.requestedScopes[platform.id] || [];
                  return (
                    <div key={platform.id} className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded ${platform.color} flex items-center justify-center text-white text-xs font-medium`}>
                          {platform.name.charAt(0)}
                        </div>
                        <h4 className="font-medium">{platform.name}</h4>
                        {connectedPlatforms.includes(platform.id) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Connected
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {requestedScopes.map((scope) => {
                          const description = getScopeDescription(scope);
                          const isSelected = selectedPermissions[platform.id]?.includes(scope) || false;
                          return (
                            <div key={scope} className="flex items-start space-x-3 p-3 border rounded-lg">
                              <Checkbox
                                id={`${platform.id}-${scope}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(platform.id, scope, checked as boolean)
                                }
                                disabled={!connectedPlatforms.includes(platform.id)}
                              />
                              <div className="space-y-1 flex-1">
                                <Label 
                                  htmlFor={`${platform.id}-${scope}`}
                                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                    !connectedPlatforms.includes(platform.id) ? 'text-gray-400' : ''
                                  }`}
                                >
                                  {description.name}
                                </Label>
                                <p className={`text-sm ${
                                  !connectedPlatforms.includes(platform.id) ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {description.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[0, 1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step + 1}
            </div>
            {step < 2 && (
              <div className={`w-16 h-1 mx-2 ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Current Step */}
      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        {currentStep === 2 ? (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
            className="flex items-center space-x-2"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
