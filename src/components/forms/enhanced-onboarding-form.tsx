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
  requested_permissions: Record<string, string[]>;
  link_name?: string;
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
  const [formData, setFormData] = useState(() => {
    // Initialize form data from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`onboarding_form_${token}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('[Onboarding] Restored form data from localStorage:', parsed);
          return parsed;
        } catch (e) {
          console.warn('[Onboarding] Failed to parse saved form data:', e);
        }
      }
    }
    return {
      name: '',
      email: '',
      company: ''
    };
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showTestModePopup, setShowTestModePopup] = useState(false);
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
            requested_permissions: linkData.requested_permissions || {}
          });
          
          // Initialize selected permissions with all requested permissions pre-selected
          const initialPermissions: Record<string, string[]> = {};
          if (linkData.requested_permissions) {
            Object.entries(linkData.requested_permissions).forEach(([platform, scopes]) => {
              // Ensure scopes is an array before spreading
              if (Array.isArray(scopes)) {
                initialPermissions[platform] = [...scopes]; // Pre-select all scopes
              } else {
                initialPermissions[platform] = []; // Fallback to empty array
              }
            });
          }
          setSelectedPermissions(initialPermissions);
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
            console.log('[Onboarding] Loading existing request data:', data.request);
            console.log('[Onboarding] Current form data before loading:', formData);
            
            // Check if we have saved form data in localStorage
            const hasLocalData = typeof window !== 'undefined' && 
              localStorage.getItem(`onboarding_form_${token}`) !== null;
            
            if (!hasLocalData) {
              // Only load from API if we don't have localStorage data
              console.log('[Onboarding] No localStorage data, loading from API');
              setFormData(prev => {
                const newData = {
                  name: prev.name || data.request.client_name || '',
                  email: prev.email || data.request.client_email || '',
                  company: prev.company || data.request.company_name || '',
                };
                console.log('[Onboarding] Form data after loading request data:', newData);
                
                // Save to localStorage
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`onboarding_form_${token}`, JSON.stringify(newData));
                }
                
                return newData;
              });
            } else {
              console.log('[Onboarding] localStorage data exists, skipping API form data load');
            }
            
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
    console.log(`[Onboarding] Input change - ${field}:`, value);
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('[Onboarding] Updated form data:', newData);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`onboarding_form_${token}`, JSON.stringify(newData));
        console.log('[Onboarding] Saved form data to localStorage');
      }
      
      return newData;
    });
  };

  // Debug: Log form data changes
  useEffect(() => {
    console.log('[Onboarding] Form data changed:', formData);
  }, [formData]);


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

  const handleAutoSubmit = async () => {
    if (isSubmitting || isCompleted) return;
    
    setIsSubmitting(true);
    console.log('[Onboarding] Auto-submitting onboarding data...');
    console.log('[Onboarding] Form data state:', formData);
    console.log('[Onboarding] Selected permissions:', selectedPermissions);
    
    try {
      // Convert selectedPermissions to the format expected by the API
      const permissions = Object.entries(selectedPermissions).flatMap(([platform, scopes]) =>
        scopes.map(scope => `${platform}:${scope}`)
      );

      const payload = {
        token,
        permissions,
        data: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
        },
      };
      
      console.log('[Onboarding] Full payload being sent:', payload);
      console.log('[Onboarding] Data validation:', {
        hasName: !!formData.name,
        hasEmail: !!formData.email,
        hasCompany: !!formData.company,
        nameValue: formData.name,
        emailValue: formData.email,
        companyValue: formData.company
      });

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Onboarding] Auto-submission successful:', data);
        setIsCompleted(true);
        onSubmissionComplete(data.requestId);
        
        // Redirect to client dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/client';
        }, 3000);
      } else {
        console.error('[Onboarding] Auto-submission failed:', response.statusText);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[Onboarding] Error in auto-submission:', error);
      setIsSubmitting(false);
    }
  };

  const handleTestModeSubmit = async () => {
    console.log('[Onboarding] handleTestModeSubmit called');
    console.log('[Onboarding] isSubmitting:', isSubmitting, 'isCompleted:', isCompleted);
    
    if (isSubmitting || isCompleted) {
      console.log('[Onboarding] Skipping test mode submit - already submitting or completed');
      return;
    }
    
    setIsSubmitting(true);
    console.log('[Onboarding] Test mode submission...');
    console.log('[Onboarding] Form data:', formData);
    console.log('[Onboarding] Link data:', linkData);
    
    try {
      // Create dummy permissions for test mode
      const testPermissions = linkData?.platforms.map(platform => `${platform}:test_scope`) || [];
      console.log('[Onboarding] Test permissions:', testPermissions);

      const requestBody = {
        token,
        permissions: testPermissions,
        data: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
        },
        testMode: true, // Flag to indicate test mode
      };
      
      console.log('[Onboarding] Request body:', requestBody);

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Onboarding] Test mode submission successful:', data);
        setIsCompleted(true);
        
        // Clear localStorage data after successful submission
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`onboarding_form_${token}`);
          console.log('[Onboarding] Cleared localStorage data after successful submission');
        }
        
        // Call onSubmissionComplete with requestId if available, otherwise with success message
        if (onSubmissionComplete) {
          onSubmissionComplete(data.requestId || 'submission-successful');
        }
        
        // Redirect to client dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/client';
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Onboarding] Test mode submission failed:', response.status, response.statusText, errorData);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[Onboarding] Error in test mode submission:', error);
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    console.log('[Onboarding] handleNext called - current step:', currentStep);
    console.log('[Onboarding] Form data before advancing:', formData);
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        console.log('[Onboarding] Advancing from step', prev, 'to step', nextStep);
        return nextStep;
      });
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
  const requestedScopes = currentPlatform ? (linkData?.requested_permissions[currentPlatform.id] || []) : [];
  const hasRequiredPermissions = requestedScopes.length === 0 || 
    requestedScopes.every(scope => selectedPermissions[currentPlatform?.id || '']?.includes(scope));

  // For the final step, check if ALL platforms are connected and have required permissions
  const allPlatformsConnected = requestedPlatforms.every(platform => connectedPlatforms[platform.id]);
  const allPlatformsHavePermissions = requestedPlatforms.every(platform => {
    const platformScopes = linkData?.requested_permissions[platform.id] || [];
    return platformScopes.length === 0 || 
      platformScopes.every(scope => selectedPermissions[platform.id]?.includes(scope));
  });
  const isFinalStepComplete = allPlatformsConnected && allPlatformsHavePermissions;
  
  // Test mode: allow completion even without OAuth connections
  const canCompleteInTestMode = testMode && formData.name.trim() && formData.email.trim();
  const hasPersonalInfo = Boolean(formData.name.trim() && formData.email.trim());
  
  // For test mode, we don't require OAuth connections to be complete
  const canProceedWithTestMode = !isFinalStepComplete && hasPersonalInfo;

  // Removed auto-complete behavior: require explicit button click to finish
  // Previously, this auto-submitted when all platforms were connected and required permissions were selected.
  // Now we only submit when the user clicks the completion button.
  
  // Handle completion button click
  const handleCompletionClick = () => {
    console.log('[Onboarding] Completion button clicked');
    console.log('[Onboarding] isFinalStepComplete:', isFinalStepComplete);
    console.log('[Onboarding] testMode:', testMode);
    console.log('[Onboarding] canCompleteInTestMode:', canCompleteInTestMode);
    console.log('[Onboarding] hasPersonalInfo:', hasPersonalInfo, 'formData:', formData);
    console.log('[Onboarding] canProceedWithTestMode:', canProceedWithTestMode);
    
    if (isFinalStepComplete) {
      // All platforms connected, proceed normally
      console.log('[Onboarding] Proceeding with normal submission');
      handleAutoSubmit();
    } else if (canProceedWithTestMode) {
      // OAuth not complete but we have personal info, show test mode popup
      console.log('[Onboarding] OAuth not complete, showing test mode popup');
      setShowTestModePopup(true);
    } else {
      // Missing personal info, redirect to step 0
      console.log('[Onboarding] Missing personal info, redirecting to step 0');
      setCurrentStep(0);
    }
  };
  
  // Handle test mode confirmation
  const handleTestModeConfirm = () => {
    console.log('[Onboarding] Test mode confirmed, starting submission...');
    console.log('[Onboarding] Current form data before test mode:', formData);
    
    setTestMode(true);
    setShowTestModePopup(false);
    console.log('[Onboarding] About to call handleTestModeSubmit with data:', formData);
    handleTestModeSubmit();
  };

  // Debug logging for final step (simplified)
  if (currentStep === getTotalSteps() - 1 && process.env.NODE_ENV === 'development') {
    console.log('[Onboarding] Final step:', {
      allPlatformsConnected,
      allPlatformsHavePermissions,
      isFinalStepComplete
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
              <div className="text-center space-y-4">
                {isCompleted ? (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Access Granted Successfully!</span>
                  </div>
                ) : isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Finalizing Access Grant...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-gray-500 text-sm text-center">
                      {isFinalStepComplete 
                        ? "All platforms connected. Ready to finalize access grant."
                        : "OAuth connections didn't work properly. Click below to complete the flow in test mode."
                      }
                    </div>
                    <Button
                      onClick={handleCompletionClick}
                      disabled={isSubmitting || isCompleted}
                      className={`w-full text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        isFinalStepComplete 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Finalizing Access Grant...
                        </>
                      ) : (
                        'Complete Access Grant'
                      )}
                    </Button>
                  </div>
                )}
              </div>
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

      {/* Test Mode Popup */}
      {showTestModePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                OAuth Didn't Work Properly
              </h3>
              <p className="text-gray-600 mb-6">
                The OAuth connections didn't complete successfully. You can continue in test mode to complete the onboarding flow and save your information.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowTestModePopup(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTestModeConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Continue in Test Mode'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}