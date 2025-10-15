'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  ArrowRight,
  Globe 
} from 'lucide-react';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';
import { toast } from 'sonner';

interface OnboardingFormProps {
  token: string;
  onSubmissionComplete: (requestId: string) => void;
}

interface LinkData {
  platforms: string[];
  requested_permissions: Record<string, string[]>;
  link_name?: string;
}

interface PlatformStatus {
  connected: boolean;
  error?: string;
  scopes?: string[];
}

type ConnectionStatus = Record<string, PlatformStatus>;

// Platform logo helper
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
    const isShopify = platformId.toLowerCase() === 'shopify';
    return (
      <Image 
        src={logoPath} 
        alt={platformId} 
        width={32} 
        height={32} 
        className={isShopify ? "object-contain scale-200" : "object-contain"}
        style={isShopify ? { objectPosition: 'center' } : undefined}
      />
    );
  }
  
  return <Globe className="h-8 w-8" />;
};

export function UnifiedOnboardingForm({ token, onSubmissionComplete }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'info' | 'platforms' | 'complete'>('info');
  
  // Client information
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    company: ''
  });
  
  // Link data and platforms
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [platforms, setPlatforms] = useState<any[]>([]);
  
  // Platform connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  
  // Shopify specific state
  const [shopifyStoreId, setShopifyStoreId] = useState('');
  const [shopifyCollaboratorCode, setShopifyCollaboratorCode] = useState('');
  const [shopifyStep, setShopifyStep] = useState<1 | 2>(1);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string>('');
  
  // Load onboarding link data
  useEffect(() => {
    const loadLinkData = async () => {
      try {
        const response = await fetch(`/api/onboarding/request?token=${token}`);
        if (!response.ok) {
          throw new Error('Failed to load onboarding link');
        }
        
        const data = await response.json();
        
        if (!data.link) {
          throw new Error('Link data not found in response');
        }
        
        setLinkData(data.link);
        
        // Get platform details
        const allPlatforms = getAllPlatforms();
        const requestedPlatforms = (data.link.platforms || [])
          .map((platformId: string) => allPlatforms.find(p => p.id === platformId))
          .filter(Boolean);
        setPlatforms(requestedPlatforms);
        
        // Initialize connection status
        const initialStatus: ConnectionStatus = {};
        requestedPlatforms.forEach((platform: any) => {
          initialStatus[platform.id] = { connected: false };
        });
        setConnectionStatus(initialStatus);
        
        // Check for OAuth callback
        const connectedPlatform = searchParams.get('connected');
        const success = searchParams.get('success');
        
        if (connectedPlatform && success === 'true') {
          setConnectionStatus(prev => ({
            ...prev,
            [connectedPlatform]: { connected: true }
          }));
          setCurrentStep('platforms');
          toast.success(`${connectedPlatform} connected successfully!`);
        }
        
      } catch (error) {
        console.error('Error loading link data:', error);
        toast.error('Failed to load onboarding link');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLinkData();
  }, [token, searchParams]);
  
  // Handle client info submission
  const handleClientInfoSubmit = () => {
    if (!clientInfo.name || !clientInfo.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setCurrentStep('platforms');
    // Auto-expand first platform
    if (platforms.length > 0) {
      setExpandedPlatform(platforms[0].id);
    }
  };
  
  // Handle OAuth platform connection
  const handleOAuthConnect = (platformId: string) => {
    // Redirect to OAuth flow
    window.location.href = `/api/oauth/client/connect/${platformId}?token=${token}`;
  };
  
  // Handle Shopify verification
  const handleShopifyVerify = async () => {
    if (!shopifyStoreId || !shopifyCollaboratorCode) {
      toast.error('Please fill in all Shopify fields');
      return;
    }
    
    try {
      // Get client ID from onboarding request
      const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
      if (!requestResponse.ok) {
        throw new Error('Failed to get client information');
      }
      const requestData = await requestResponse.json();
      
      if (!requestData.client_id) {
        throw new Error('Client ID not found');
      }
      
      // Verify Shopify access
      const verifyResponse = await fetch('/api/integrations/shopify/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: requestData.client_id,
          storeDomain: `${shopifyStoreId}.myshopify.com`,
          collaboratorCode: shopifyCollaboratorCode,
        }),
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify Shopify store access');
      }
      
      // Mark as connected
      setConnectionStatus(prev => ({
        ...prev,
        shopify: { connected: true }
      }));
      
      // Reset Shopify data
      setShopifyStoreId('');
      setShopifyCollaboratorCode('');
      setShopifyStep(1);
      
      toast.success('Shopify store connected successfully!');
      
    } catch (error: any) {
      console.error('Shopify verification error:', error);
      toast.error(error.message || 'Failed to verify Shopify store');
    }
  };
  
  // Handle final submission
  const handleFinalSubmit = async () => {
    // Check if all platforms are connected
    const allConnected = platforms.every(platform => 
      connectionStatus[platform.id]?.connected
    );
    
    if (!allConnected) {
      toast.error('Please connect all required platforms before submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          company_name: clientInfo.company,
          platform_connections: platforms.map(p => p.id),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit onboarding');
      }
      
      const data = await response.json();
      setCurrentStep('complete');
      toast.success('Onboarding completed successfully!');
      
      // Call completion callback
      setTimeout(() => {
        onSubmissionComplete(data.requestId);
      }, 2000);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate progress
  const getTotalSteps = () => {
    return 1 + platforms.length + 1; // Info + Platforms + Submit
  };
  
  const getCurrentStepNumber = () => {
    if (currentStep === 'info') return 1;
    if (currentStep === 'platforms') {
      const connectedCount = Object.values(connectionStatus).filter(s => s.connected).length;
      return 1 + connectedCount + 1;
    }
    return getTotalSteps();
  };

  const getProgressSteps = () => {
    const steps = [
      {
        id: 'info',
        name: 'Information',
        number: 1,
        completed: currentStep !== 'info',
        current: currentStep === 'info',
        logo: null
      }
    ];

    // Add platform steps
    platforms.forEach((platform, index) => {
      const platformStepId = `platform-${platform.id}`;
      const isCompleted = connectionStatus[platform.id]?.connected || false;
      const isCurrent = currentStep === 'platforms' && !isCompleted && 
        platforms.slice(0, index).every(p => connectionStatus[p.id]?.connected);

      steps.push({
        id: platformStepId,
        name: platform.name,
        number: index + 2,
        completed: isCompleted,
        current: isCurrent,
        logo: platform.logo
      });
    });

    // Add completion step
    steps.push({
      id: 'complete',
      name: 'Complete',
      number: steps.length + 1,
      completed: currentStep === 'complete',
      current: false,
      logo: null
    });

    return steps;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading onboarding..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-center mb-4">
              <Image 
                src="/logos/vast.webp" 
                alt="Vast Logo" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
            </div>
            <div className="text-center mb-4">
              <h1 className="text-lg font-bold text-gray-900">Client Onboarding</h1>
              {linkData?.link_name && (
                <p className="text-sm text-gray-600">{linkData.link_name}</p>
              )}
            </div>
            
            {/* Progress bar with circles */}
            <div className="flex items-center justify-center space-x-2">
              {getProgressSteps().map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                    ${step.completed 
                      ? 'bg-primary text-white' 
                      : step.current 
                        ? 'bg-primary/20 text-primary border-2 border-primary' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step.logo ? (
                      <Image 
                        src={step.logo} 
                        alt={step.name} 
                        width={20} 
                        height={20}
                        className="object-contain"
                      />
                    ) : (
                      step.number
                    )}
                  </div>
                  {index < getProgressSteps().length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      step.completed ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-white rounded-b-2xl border-x border-b border-gray-200 shadow-sm">
          <div className="px-6 py-6">
        {/* Step 1: Client Information */}
        {currentStep === 'info' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Information</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Please provide your contact information to get started.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                  className="focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={clientInfo.company}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Acme Inc."
                  className="focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <Button 
                onClick={handleClientInfoSubmit}
                disabled={!clientInfo.name || !clientInfo.email}
                className="w-full gradient-primary"
                size="lg"
              >
                Continue to Platform Connections
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Platform Connections */}
        {currentStep === 'platforms' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect Your Platforms</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Connect each platform to grant access to your accounts.
              </p>
            </div>
            
            <Accordion 
              type="single" 
              collapsible 
              value={expandedPlatform}
              onValueChange={setExpandedPlatform}
              className="space-y-4"
            >
              {platforms.map((platform, index) => {
                const status = connectionStatus[platform.id];
                const isConnected = status?.connected;
                const isShopify = platform.id === 'shopify';
                
                return (
                  <AccordionItem 
                    key={platform.id} 
                    value={platform.id}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4 w-full">
                        <div className="flex-shrink-0">
                          {getPlatformLogo(platform.id)}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {platform.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isConnected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isConnected ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 py-4 bg-gray-50">
                      {isShopify ? (
                        // Shopify inline two-step process
                        <div className="space-y-6">
                          {!isConnected ? (
                            <>
                              {/* Step 1: Store ID */}
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                    Step 1: Enter your Shopify Store URL
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-700">https://</span>
                                    <Input
                                      value={shopifyStoreId}
                                      onChange={(e) => setShopifyStoreId(e.target.value)}
                                      placeholder="your-store"
                                      className="w-40"
                                      autoCapitalize="off"
                                      autoCorrect="off"
                                      spellCheck="false"
                                    />
                                    <span className="text-sm text-gray-700">.myshopify.com</span>
                                  </div>
                                </div>
                                
                                <Button
                                  onClick={() => {
                                    if (shopifyStoreId.trim()) {
                                      setShopifyStep(2);
                                    } else {
                                      toast.error('Please enter your store ID');
                                    }
                                  }}
                                  className="gradient-primary"
                                  disabled={!shopifyStoreId.trim()}
                                >
                                  Next
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Step 2: Collaborator Code */}
                              {shopifyStep === 2 && (
                                <div className="space-y-4 border-t border-gray-200 pt-6">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                      Step 2: Get your Collaborator Request Code
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                      Open your Shopify admin and navigate to Settings → Users and Permissions → Collaborators. 
                                      Look for your collaborator request code in the "Collaborator access" section.
                                    </p>
                                    <Button
                                      onClick={() => {
                                        // Try multiple URL formats for different Shopify store types
                                        const urls = [
                                          `https://${shopifyStoreId}.myshopify.com/admin/settings/account`,
                                          `https://admin.shopify.com/store/${shopifyStoreId}/settings/account`,
                                          `https://${shopifyStoreId}.myshopify.com/admin/settings/users`
                                        ];
                                        
                                        // Try opening the first URL, if it fails, try the next one
                                        const tryOpenUrl = (index: number) => {
                                          if (index >= urls.length) {
                                            alert('Unable to open Shopify admin. Please manually navigate to your store settings.');
                                            return;
                                          }
                                          
                                          const newWindow = window.open(urls[index], '_blank');
                                          
                                          // Check if window opened successfully
                                          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                            // Try next URL
                                            setTimeout(() => tryOpenUrl(index + 1), 100);
                                          }
                                        };
                                        
                                        tryOpenUrl(0);
                                      }}
                                      variant="outline"
                                      className="w-full mb-4"
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Open Shopify Admin
                                    </Button>
                                    
                                    <Label htmlFor="collaboratorCode">
                                      Collaborator Request Code
                                    </Label>
                                    <Input
                                      id="collaboratorCode"
                                      value={shopifyCollaboratorCode}
                                      onChange={(e) => setShopifyCollaboratorCode(e.target.value)}
                                      placeholder="Enter code or 'none'"
                                      className="mt-2"
                                    />
                                  </div>
                                  
                                  <Button
                                    onClick={handleShopifyVerify}
                                    className="w-full gradient-primary"
                                    disabled={!shopifyCollaboratorCode.trim()}
                                  >
                                    Verify Shopify Access
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center space-x-3 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Shopify store connected successfully</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        // OAuth platforms (Google, Meta, TikTok)
                        <div className="space-y-4">
                          {!isConnected ? (
                            <>
                              <p className="text-sm text-gray-700">
                                Click the button below to securely connect your {platform.name} account. 
                                You'll be redirected to {platform.name} to authorize access.
                              </p>
                              <Button
                                onClick={() => handleOAuthConnect(platform.id)}
                                className="w-full gradient-primary"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Connect {platform.name}
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-3 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">{platform.name} connected successfully</span>
                            </div>
                          )}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            {/* Submit button - only show when all platforms are connected */}
            {Object.values(connectionStatus).every(s => s.connected) && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ready to Submit?
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      All {platforms.length} platforms connected
                    </p>
                  </div>
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="gradient-primary"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" text="Submitting..." />
                    ) : (
                      <>
                        Complete Onboarding
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Completion */}
        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Onboarding Complete!
            </h2>
            <p className="text-gray-600 text-sm">
              Thank you for connecting your platforms. You'll be redirected shortly.
            </p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
