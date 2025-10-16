'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
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
    'shopify': '/logos/shopify.webp',
  };

  const logoPath = logoMap[platformId.toLowerCase()];
  
  if (logoPath) {
    return (
      <Image 
        src={logoPath} 
        alt={platformId} 
        width={32} 
        height={32} 
        className="object-contain"
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
  
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string>('');
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  
  // Asset selection state - now using dropdown selections
  const [platformAssets, setPlatformAssets] = useState<Record<string, any[]>>({});
  const [selectedAssets, setSelectedAssets] = useState<Record<string, Record<string, string>>>({});
  const [isLoadingAssets, setIsLoadingAssets] = useState<Record<string, boolean>>({});
  const [showAssetSelection, setShowAssetSelection] = useState<Record<string, boolean>>({});
  const [oauthConfirmation, setOauthConfirmation] = useState<{
    platform: string;
    platformName: string;
    assets: any[];
  } | null>(null);
  
  // Shopify-specific state
  const [shopifyStep, setShopifyStep] = useState(1);
  const [shopifyData, setShopifyData] = useState({
    storeId: '',
    collaboratorCode: ''
  });
  
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
        
        // If no requests exist, create one with basic info
        if (!data.requests || data.requests.length === 0) {
          console.log('No onboarding requests found, creating one...');
          try {
            const createResponse = await fetch('/api/onboarding/request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token,
                client_email: '',
                client_name: '',
                company_name: '',
              }),
            });
            
            if (createResponse.ok) {
              const createData = await createResponse.json();
              console.log('Onboarding request created:', createData);
            }
          } catch (createError) {
            console.error('Error creating initial onboarding request:', createError);
          }
        }
        
        // Check for OAuth callback
        const connectedPlatform = searchParams.get('connected');
        const success = searchParams.get('success');
        
      if (connectedPlatform && success === 'true') {
        console.log('🔵 [UNIFIED FORM] ===========================================');
        console.log('🔵 [UNIFIED FORM] OAUTH CALLBACK DETECTED');
        console.log('🔵 [UNIFIED FORM] Connected Platform:', connectedPlatform);
        console.log('🔵 [UNIFIED FORM] Success:', success);
        console.log('🔵 [UNIFIED FORM] Setting connection status for:', connectedPlatform);
        console.log('🔵 [UNIFIED FORM] ===========================================');
        
        setConnectionStatus(prev => ({
          ...prev,
          [connectedPlatform]: { connected: true }
        }));
        
        // Show asset selection for this platform
        setShowAssetSelection(prev => ({ ...prev, [connectedPlatform]: true }));
        
        console.log('🔵 [UNIFIED FORM] Initiating asset fetch for:', connectedPlatform);
        
        // Fetch assets for this platform
        await fetchPlatformAssets(connectedPlatform);
        
        setCurrentStep('platforms');
        
        console.log('🔵 [UNIFIED FORM] OAuth callback processing complete');
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
  const handleClientInfoSubmit = async () => {
    if (!clientInfo.name || !clientInfo.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // Create or update onboarding request
      const response = await fetch('/api/onboarding/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          client_email: clientInfo.email,
          client_name: clientInfo.name,
          company_name: clientInfo.company || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create onboarding request');
      }

      const data = await response.json();
      console.log('Onboarding request created/updated:', data);
      
      setCurrentStep('platforms');
      // Auto-expand first platform
      if (platforms.length > 0) {
        setExpandedPlatform(platforms[0].id);
      }
    } catch (error) {
      console.error('Error creating onboarding request:', error);
      toast.error('Failed to start onboarding. Please try again.');
    }
  };
  
  // Handle OAuth platform connection
  const handleOAuthConnect = (platformId: string) => {
    // Redirect to OAuth flow
    window.location.href = `/api/oauth/client/connect/${platformId}?token=${token}`;
  };
  
  // Handle Shopify store ID submission
  const handleShopifyStoreIdSubmit = () => {
    if (shopifyData.storeId.trim()) {
      setShopifyStep(2);
    }
  };
  
  // Handle Shopify verification (without advancing steps)
  const handleShopifyVerification = async () => {
    try {
      // Get the client ID from the current request
      const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
      if (!requestResponse.ok) {
        throw new Error('Failed to get client information');
      }
      const requestData = await requestResponse.json();
      
      if (!requestData.client_id) {
        throw new Error('Client ID not found');
      }

      // Call the Shopify verification API
      const verifyResponse = await fetch('/api/integrations/shopify/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: requestData.client_id,
          storeDomain: `${shopifyData.storeId}.myshopify.com`,
          collaboratorCode: shopifyData.collaboratorCode
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify Shopify store access');
      }

      const verifyData = await verifyResponse.json();
      console.log('Shopify verification successful:', verifyData);

      // Mark platform as connected
      setConnectionStatus(prev => ({
        ...prev,
        shopify: { connected: true, account: shopifyData.storeId }
      }));
      
    } catch (error) {
      console.error('Shopify verification error:', error);
      toast.error(`Failed to verify Shopify store access: ${error.message}`);
      throw error; // Re-throw to prevent advancing if verification fails
    }
  };
  

  // Fetch assets for a platform
  const fetchPlatformAssets = async (platformId: string) => {
    console.log('🟢 [UNIFIED FORM] ===========================================');
    console.log('🟢 [UNIFIED FORM] FETCHING PLATFORM ASSETS');
    console.log('🟢 [UNIFIED FORM] Platform ID:', platformId);
    console.log('🟢 [UNIFIED FORM] Token:', token);
    console.log('🟢 [UNIFIED FORM] ===========================================');
    
    try {
      setIsLoadingAssets(prev => ({ ...prev, [platformId]: true }));
      
      // Get client ID from onboarding request
      console.log('🟢 [UNIFIED FORM] Step 1: Getting client ID from onboarding request...');
      const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
      console.log('🟢 [UNIFIED FORM] Request response status:', requestResponse.status);
      
      if (!requestResponse.ok) {
        const errorText = await requestResponse.text();
        console.error('🔴 [UNIFIED FORM] Failed to get client information:', errorText);
        throw new Error('Failed to get client information');
      }
      
      const requestData = await requestResponse.json();
      console.log('🟢 [UNIFIED FORM] Request data received:', requestData);
      console.log('🟢 [UNIFIED FORM] Request data.requests:', requestData.requests);
      console.log('🟢 [UNIFIED FORM] Request data.requests length:', requestData.requests?.length);
      
      const latestRequest = requestData.requests && requestData.requests.length > 0 
        ? requestData.requests[0] 
        : null;
      
      console.log('🟢 [UNIFIED FORM] Latest request:', latestRequest);
      console.log('🟢 [UNIFIED FORM] Latest request ID:', latestRequest?.id);
      console.log('🟢 [UNIFIED FORM] Latest request platform_connections:', latestRequest?.platform_connections);
      
      if (!latestRequest || !latestRequest.id) {
        console.error('🔴 [UNIFIED FORM] Client ID not found in request data');
        throw new Error('Client ID not found');
      }

      console.log('🟢 [UNIFIED FORM] Step 2: Making assets API call...');
      const assetsUrl = `/api/platforms/assets?platform=${platformId}&clientId=${latestRequest.id}`;
      console.log('🟢 [UNIFIED FORM] Assets URL:', assetsUrl);

      // Fetch assets from platform API
      const assetsResponse = await fetch(assetsUrl);
      
      console.log('🟢 [UNIFIED FORM] Assets response status:', assetsResponse.status);
      console.log('🟢 [UNIFIED FORM] Assets response ok:', assetsResponse.ok);
      
      if (!assetsResponse.ok) {
        const errorText = await assetsResponse.text();
        console.error('🔴 [UNIFIED FORM] Assets API error:', assetsResponse.status, errorText);
        throw new Error(`Failed to fetch platform assets: ${assetsResponse.status}`);
      }
      
      const assetsData = await assetsResponse.json();
      console.log('🟢 [UNIFIED FORM] Assets data received:', assetsData);
      console.log('🟢 [UNIFIED FORM] Assets array:', assetsData.assets);
      console.log('🟢 [UNIFIED FORM] Assets count:', assetsData.assets?.length || 0);
      
      // Debug: Log each asset type found
      if (assetsData.assets && assetsData.assets.length > 0) {
        const assetTypes = [...new Set(assetsData.assets.map((asset: any) => asset.type))];
        console.log('🔍 [ASSET DEBUG] Asset types found:', assetTypes);
        assetsData.assets.forEach((asset: any, index: number) => {
          console.log(`🔍 [ASSET DEBUG] Asset ${index + 1}:`, {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            description: asset.description
          });
        });
      }
      
      setPlatformAssets(prev => {
        const newState = { ...prev, [platformId]: assetsData.assets || [] };
        console.log('🟢 [UNIFIED FORM] State updated for platformAssets:', platformId, newState[platformId]);
        console.log('🟢 [UNIFIED FORM] Full platformAssets state after update:', newState);
        return newState;
      });
      console.log('🟢 [UNIFIED FORM] Assets set in state for', platformId, ':', assetsData.assets || []);
      
    } catch (error: any) {
      console.error('🔴 [UNIFIED FORM] ===========================================');
      console.error('🔴 [UNIFIED FORM] ERROR FETCHING PLATFORM ASSETS');
      console.error('🔴 [UNIFIED FORM] Platform:', platformId);
      console.error('🔴 [UNIFIED FORM] Error:', error);
      console.error('🔴 [UNIFIED FORM] Error message:', error.message);
      console.error('🔴 [UNIFIED FORM] Error stack:', error.stack);
      console.error('🔴 [UNIFIED FORM] ===========================================');
      toast.error(error.message || 'Failed to fetch platform assets');
      setPlatformAssets(prev => ({ ...prev, [platformId]: [] }));
    } finally {
      setIsLoadingAssets(prev => ({ ...prev, [platformId]: false }));
      console.log('🟢 [UNIFIED FORM] Loading state cleared for platform:', platformId);
    }
  };

  // Group assets by type for dropdown display
  const groupAssetsByType = (assets: any[]) => {
    console.log('🔍 [GROUP DEBUG] groupAssetsByType called with assets:', assets);
    console.log('🔍 [GROUP DEBUG] assets length:', assets?.length || 0);
    
    const grouped: Record<string, any[]> = {};
    assets.forEach((asset, index) => {
      console.log(`🔍 [GROUP DEBUG] Processing asset ${index + 1}:`, asset);
      console.log(`🔍 [GROUP DEBUG] Asset ${index + 1} type:`, asset?.type);
      const type = asset.type || 'other';
      console.log(`🔍 [GROUP DEBUG] Asset ${index + 1} final type:`, type);
      
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(asset);
    });
    
    console.log('🔍 [GROUP DEBUG] Final grouped result:', grouped);
    return grouped;
  };

  // Get display name for asset type
  const getAssetTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      // Meta asset types
      'page': 'Pages',
      'ad_account': 'Ad Accounts',
      'catalog': 'Catalogs',
      'business_dataset': 'Datasets',
      'instagram_account': 'Instagram Accounts',
      // Google asset types
      'ads_account': 'Google Ads Accounts',
      'analytics_property': 'Analytics Properties',
      'business_profile': 'Business Profiles',
      'tag_manager': 'Tag Manager Accounts',
      'search_console_site': 'Search Console Sites',
      'merchant_center': 'Merchant Center Accounts',
      'tagmanager_account': 'Tag Manager Accounts',
      'searchconsole_site': 'Search Console Sites',
      'business_account': 'Business Accounts',
      'merchant_account': 'Merchant Center Accounts',
      'other': 'Other Assets'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Check if asset type should be shown based on requested scopes
  const shouldShowAssetType = (platformId: string, assetType: string) => {
    console.log(`🔍 [SCOPE FILTER] ===== Checking asset type ${assetType} for platform ${platformId} =====`);
    console.log(`🔍 [SCOPE FILTER] linkData:`, linkData);
    console.log(`🔍 [SCOPE FILTER] linkData.requested_permissions:`, linkData?.requested_permissions);
    
    if (!linkData?.requested_permissions?.[platformId]) {
      console.log(`🔍 [SCOPE FILTER] No requested permissions for platform ${platformId}`);
      return true; // Show all if no specific permissions requested
    }

    const requestedScopes = linkData.requested_permissions[platformId];
    console.log(`🔍 [SCOPE FILTER] Requested scopes for ${platformId}:`, requestedScopes);

    // Map asset types to required scopes
    const assetTypeToScopes: Record<string, string[]> = {
      // Meta asset types
      'page': ['pages_show_list', 'pages_read_engagement'],
      'ad_account': ['ads_read', 'ads_management'],
      'catalog': ['catalog_management', 'business_management'],
      'business_dataset': ['business_management', 'ads_read'],
      'instagram_account': ['instagram_basic', 'pages_show_list'],
      // Google asset types
      'ads_account': ['https://www.googleapis.com/auth/adwords'],
      'analytics_property': ['https://www.googleapis.com/auth/analytics.readonly'],
      'business_profile': ['https://www.googleapis.com/auth/business.manage'],
      'tag_manager': ['https://www.googleapis.com/auth/tagmanager.readonly'],
      'search_console_site': ['https://www.googleapis.com/auth/webmasters.readonly'],
      'merchant_center': ['https://www.googleapis.com/auth/content'],
      'tagmanager_account': ['https://www.googleapis.com/auth/tagmanager.readonly'],
      'searchconsole_site': ['https://www.googleapis.com/auth/webmasters.readonly'],
      'business_account': ['https://www.googleapis.com/auth/business.manage'],
      'merchant_account': ['https://www.googleapis.com/auth/content'],
      'other': []
    };

    const requiredScopes = assetTypeToScopes[assetType] || [];
    console.log(`🔍 [SCOPE FILTER] Required scopes for ${assetType}:`, requiredScopes);

    if (requiredScopes.length === 0) {
      console.log(`🔍 [SCOPE FILTER] No specific scopes required for ${assetType}, showing`);
      return true;
    }

    const hasRequiredScope = requiredScopes.some(scope => requestedScopes.includes(scope));
    console.log(`🔍 [SCOPE FILTER] Has required scope for ${assetType}:`, hasRequiredScope);
    
    return hasRequiredScope;
  };

  // Debug: Monitor platformAssets state changes
  useEffect(() => {
    console.log('🔍 [STATE DEBUG] platformAssets state changed:', platformAssets);
    Object.entries(platformAssets).forEach(([platformId, assets]) => {
      console.log(`🔍 [STATE DEBUG] Platform ${platformId} has ${assets?.length || 0} assets:`, assets);
    });
  }, [platformAssets]);

  // Handle asset selection (dropdown-based)
  const handleAssetSelection = (platformId: string, assetType: string, assetId: string) => {
    setSelectedAssets(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [assetType]: assetId
      }
    }));
  };

  // Save selected assets and continue
  const handleAssetSelectionComplete = async (platformId: string) => {
    console.log('🟣 [UNIFIED FORM] ===========================================');
    console.log('🟣 [UNIFIED FORM] SAVING SELECTED ASSETS');
      console.log('🟣 [UNIFIED FORM] Platform:', platformId);
      console.log('🟣 [UNIFIED FORM] Selected assets:', selectedAssets[platformId]);
      console.log('🟣 [UNIFIED FORM] ===========================================');
      
      try {
        // Get client ID from onboarding request
        const requestResponse = await fetch(`/api/onboarding/request?token=${token}`);
        if (!requestResponse.ok) {
          throw new Error('Failed to get client information');
        }
        const requestData = await requestResponse.json();
        const latestRequest = requestData.requests && requestData.requests.length > 0 
          ? requestData.requests[0] 
          : null;
        
        if (!latestRequest || !latestRequest.id) {
          throw new Error('Client ID not found');
        }

        console.log('🟣 [UNIFIED FORM] Calling save-assets API...');
        
        // Convert dropdown selections to array format for API
        const selectedAssetsArray = Object.values(selectedAssets[platformId] || {}).filter(Boolean);
        
        // Save selected assets
        const saveResponse = await fetch('/api/platforms/save-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: latestRequest.id,
            platform: platformId,
            selectedAssets: selectedAssetsArray
          }),
        });

      console.log('🟣 [UNIFIED FORM] Save-assets response status:', saveResponse.status);

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('🔴 [UNIFIED FORM] Failed to save assets:', errorText);
        throw new Error('Failed to save selected assets');
      }

      const responseData = await saveResponse.json();
      console.log('🟣 [UNIFIED FORM] Save-assets response:', responseData);

      // Hide asset selection and move to next platform
      setShowAssetSelection(prev => ({ ...prev, [platformId]: false }));
      
      if (currentPlatformIndex < platforms.length - 1) {
        console.log('🟣 [UNIFIED FORM] Moving to next platform...');
        setCurrentPlatformIndex(currentPlatformIndex + 1);
      } else {
        // All platforms completed
        console.log('🟣 [UNIFIED FORM] All platforms completed! Setting current step to complete');
        setCurrentStep('complete');
      }
      
      toast.success('Assets selected successfully!');
      
    } catch (error: any) {
      console.error('🔴 [UNIFIED FORM] Error saving selected assets:', error);
      toast.error(error.message || 'Failed to save selected assets');
    }
  };
  
  // Handle final submission
  const handleFinalSubmit = async () => {
    // Check if all platforms are connected using the updated logic
    if (!allPlatformsConnected()) {
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
      const isCurrent = currentStep === 'platforms' && currentPlatformIndex === index;

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

  const allPlatformsConnected = () => {
    return platforms.every(platform => {
      if (platform.id === 'shopify') {
        // For Shopify, consider it connected if we have both store ID and collaborator code
        return shopifyData.storeId.trim() && shopifyData.collaboratorCode.trim();
      }
      return connectionStatus[platform.id]?.connected;
    });
  };

  const getCurrentPlatform = () => {
    return platforms[currentPlatformIndex] || null;
  };

  const getMockAssetsForPlatform = (platformId: string) => {
    switch (platformId.toLowerCase()) {
      case 'google':
        return [
          { id: 'gmail', name: 'Gmail', type: 'email', description: 'Email access' },
          { id: 'drive', name: 'Google Drive', type: 'storage', description: 'File storage access' },
          { id: 'calendar', name: 'Google Calendar', type: 'calendar', description: 'Calendar access' }
        ];
      case 'meta':
        return [
          { id: 'facebook', name: 'Facebook Page', type: 'page', description: 'Page management' },
          { id: 'instagram', name: 'Instagram Account', type: 'account', description: 'Account access' },
          { id: 'ads', name: 'Meta Ads', type: 'ads', description: 'Advertising access' }
        ];
      case 'tiktok':
        return [
          { id: 'tiktok', name: 'TikTok Account', type: 'account', description: 'Account access' },
          { id: 'analytics', name: 'TikTok Analytics', type: 'analytics', description: 'Analytics access' }
        ];
      default:
        return [
          { id: 'account', name: 'Account Access', type: 'account', description: 'General account access' }
        ];
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!allPlatformsConnected()) {
      toast.error('Please connect all platforms before completing onboarding');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Handle Shopify data submission if we have both store ID and collaborator code
      if (platforms[currentPlatformIndex]?.id === 'shopify' && shopifyData.storeId.trim() && shopifyData.collaboratorCode.trim()) {
        await handleShopifyVerification();
        
        // Show success message for Shopify
        toast.success('Shopify store information saved successfully');
      }
      
      await handleFinalSubmit();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading onboarding..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar with Logo */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Image 
              src="/logos/vast.webp" 
              alt="Vast Logo" 
              width={48} 
              height={48}
              className="w-12 h-12"
            />
          </div>
        </div>
      </div>

      {/* Steps Bar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-4">
            {getProgressSteps().map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.current 
                      ? 'bg-primary/20 text-primary border-2 border-primary' 
                      : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : step.logo ? (
                    <Image 
                      src={step.logo} 
                      alt={step.name} 
                      width={24} 
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    step.number
                  )}
                </div>
                {index < getProgressSteps().length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-8 py-8">
        {/* Step 1: Client Information */}
        {currentStep === 'info' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl page-title text-gray-900">Your Information</h2>
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
              
              <div className="flex justify-between gap-4">
                <Button 
                  onClick={() => setCurrentStep('info')}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleClientInfoSubmit}
                  disabled={!clientInfo.name || !clientInfo.email}
                  className="flex-1 gradient-primary"
                  size="lg"
                >
                  Continue to Platform Connections
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Platform Connections */}
        {currentStep === 'platforms' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl page-title text-gray-900">Connect Your Platforms</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Connect each platform to grant access to your accounts.
              </p>
            </div>
            
            {/* Current Platform */}
            {platforms.length > 0 && currentPlatformIndex < platforms.length && (
              <div className="space-y-4">
                {(() => {
                  const platform = platforms[currentPlatformIndex];
                  const status = connectionStatus[platform.id];
                  const isConnected = status?.connected;
                  const isShopify = platform.id === 'shopify';
                
                return (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-gray-50">
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
                    </div>
                    
                    <div className="px-6 py-4 bg-white">
                      {/* Platform-specific connection UI */}
                      {isShopify ? (
                        // Shopify-specific flow
                        !isConnected ? (
                          <div className="space-y-4">
                            <div>
                              {/* Step 1: Store ID Entry */}
                              <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  Enter Your Shopify Store ID
                                </h3>
                                <p className="text-gray-600">
                                  Enter your store ID to continue with the connection process.
                                </p>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex justify-center">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700">
                                      https://
                                    </span>
                                    <Input
                                      id="storeId"
                                      value={shopifyData.storeId}
                                      onChange={(e) => setShopifyData(prev => ({ ...prev, storeId: e.target.value }))}
                                      placeholder="store-id"
                                      className="w-32 border border-gray-300 rounded-md"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      .myshopify.com
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-center">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <div className="w-4 h-4 mr-2 text-gray-500">ℹ</div>
                                    <a 
                                      href="https://help.shopify.com/en/manual/your-account/accessing-your-shopify-admin" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      How to find your store ID
                                    </a>
                                  </div>
                                </div>
                              </div>

            {shopifyStep === 1 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleShopifyStoreIdSubmit}
                  disabled={!shopifyData.storeId.trim()}
                  className="w-full max-w-xs bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            )}

                              {/* Step 2: Collaborator Code Entry - Show underneath when step 2 */}
                              {shopifyStep === 2 && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                  <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      We'll need your Shopify collaborator code
                    </h3>
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Can't find the collaborator code?</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Go to Settings → Users and permissions → Collaborator access → Generate collaborator request code
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        onClick={() => window.open(`https://admin.shopify.com/store/${shopifyData.storeId}/settings/account`, '_blank')}
                        className="w-full max-w-xs bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md"
                      >
                        OPEN SHOPIFY
                      </Button>
                    </div>
                  </div>

                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Enter your Collaborator Request Code
                                      </h3>
                                      <div className="space-y-2">
                                        <Label htmlFor="collaboratorCode" className="text-sm font-medium text-gray-700">
                                          Collaborator Request Code
                                        </Label>
                                        <Input
                                          id="collaboratorCode"
                                          value={shopifyData.collaboratorCode}
                                          onChange={(e) => setShopifyData(prev => ({ ...prev, collaboratorCode: e.target.value }))}
                                          placeholder="Enter your collaborator code"
                                          className="w-full"
                                        />
                                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                                          <div className="w-4 h-4 mt-0.5 text-gray-500">ℹ</div>
                                          <p>Note: if no code is required enter 'none'</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Shopify store connected successfully</span>
                            </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConnectionStatus(prev => ({ ...prev, shopify: { connected: false } }));
              setShopifyStep(1);
              setShopifyData({ storeId: '', collaboratorCode: '' });
            }}
            className="text-xs px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Change Store
          </Button>
                          </div>
                        )
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">You are logged in as {platform.name}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Reset connection status to allow re-authentication
                                  setConnectionStatus(prev => ({ ...prev, [platform.id]: 'pending' }));
                                  setShowAssetSelection(prev => ({ ...prev, [platform.id]: false }));
                                }}
                                className="text-xs"
                              >
                                Change Account
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Asset Selection */}
                    {isConnected && showAssetSelection[platform.id] && !isShopify && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Choose which {platform.name} assets you'd like to share with your team.
                          </p>
                          
                          {isLoadingAssets[platform.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <LoadingSpinner size="md" text="Loading assets..." />
                            </div>
                          ) : platformAssets[platform.id] && platformAssets[platform.id].length > 0 ? (
                            <div className="space-y-4">
                              {(() => {
                                console.log('🔍 [RENDER DEBUG] Current platformAssets for', platform.id, 'before grouping:', platformAssets[platform.id]);
                                console.log('🔍 [RENDER DEBUG] platformAssets state keys:', Object.keys(platformAssets));
                                console.log('🔍 [RENDER DEBUG] platformAssets[platform.id] length:', platformAssets[platform.id]?.length || 0);
                                const groupedAssets = groupAssetsByType(platformAssets[platform.id]);
                                console.log('🔍 [RENDER DEBUG] Grouped assets for', platform.id, ':', groupedAssets);
                                const filteredAssets = Object.entries(groupedAssets)
                                  .filter(([assetType]) => {
                                    const shouldShow = shouldShowAssetType(platform.id, assetType);
                                    console.log(`🔍 [RENDER DEBUG] Asset type ${assetType} should show:`, shouldShow);
                                    return shouldShow;
                                  });
                                console.log('🔍 [RENDER DEBUG] Filtered assets:', filteredAssets);
                                console.log('🔍 [RENDER DEBUG] Total asset types before filtering:', Object.keys(groupedAssets).length);
                                console.log('🔍 [RENDER DEBUG] Total asset types after filtering:', filteredAssets.length);
                                return filteredAssets.map(([assetType, assets]) => (
                                <div key={assetType} className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    {getAssetTypeDisplayName(assetType)}
                                    {assetType === 'catalog' && (
                                      <span className="ml-1 text-gray-400">?</span>
                                    )}
                                    {assetType === 'business_dataset' && (
                                      <span className="ml-1 text-gray-400">?</span>
                                    )}
                                  </Label>
                                  <Select
                                    value={selectedAssets[platform.id]?.[assetType] || ''}
                                    onValueChange={(value) => handleAssetSelection(platform.id, assetType, value)}
                                  >
                                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400">
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-300">
                                      {assets.map((asset) => (
                                        <SelectItem key={asset.id} value={asset.id} className="hover:bg-gray-50 focus:bg-gray-50">
                                          <div className="flex flex-col">
                                            <span className="font-medium">{asset.name}</span>
                                            <span className="text-xs text-gray-500">{asset.id}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                ));
                              })()}
                              
                              {/* Instagram Account Help Text */}
                              {Object.keys(groupAssetsByType(platformAssets[platform.id])).includes('instagram_account') && (
                                <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                    <span className="text-blue-600 text-xs font-bold">i</span>
                                  </div>
                                  <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Missing your Instagram Account?</p>
                                    <p className="mb-2">To link your Instagram account to Meta:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-xs">
                                      <li>Go to your Facebook Page Settings</li>
                                      <li>Navigate to "Instagram" in the left sidebar</li>
                                      <li>Click "Connect Account" and follow the prompts</li>
                                      <li>Or use Meta Business Manager to connect accounts</li>
                                    </ol>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-500">
                                No assets available to select
                              </p>
                            </div>
                          )}
                          
                          <div className="flex justify-end space-x-3 pt-6">
                            <Button
                              onClick={() => setShowAssetSelection(prev => ({ ...prev, [platform.id]: false }))}
                              variant="outline"
                              size="sm"
                            >
                              Skip
                            </Button>
                            <Button
                              onClick={() => handleAssetSelectionComplete(platform.id)}
                              className="gradient-primary"
                              size="sm"
                              disabled={!selectedAssets[platform.id] || Object.keys(selectedAssets[platform.id] || {}).length === 0}
                            >
                              Continue
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation Buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex justify-between">
                        <Button
                          onClick={() => {
                            // Handle Shopify sub-step navigation
                            if (platforms[currentPlatformIndex]?.id === 'shopify' && shopifyStep === 2) {
                              setShopifyStep(1);
                            } else {
                              // Handle platform-level navigation
                              setCurrentPlatformIndex(Math.max(0, currentPlatformIndex - 1));
                            }
                          }}
                          variant="outline"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {currentPlatformIndex + 1} of {platforms.length}
                          </span>
                        </div>
                        
                        {!showAssetSelection[platform.id] && (
                          currentPlatformIndex < platforms.length - 1 ? (
                            <Button
                              onClick={() => setCurrentPlatformIndex(currentPlatformIndex + 1)}
                              variant="outline"
                            >
                              Next
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={handleCompleteOnboarding}
                              disabled={!allPlatformsConnected()}
                              className="gradient-primary"
                            >
                              Complete Onboarding
                              <CheckCircle className="ml-2 h-4 w-4" />
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
                })()}
              </div>
            )}
            
          </div>
        )}
        
        {/* OAuth Confirmation Screen */}
        {oauthConfirmation && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getPlatformLogo(oauthConfirmation.platform)}
              </div>
              <h2 className="text-xl page-title text-gray-900 mb-2">
                {oauthConfirmation.platformName} Connected Successfully!
              </h2>
              <p className="text-gray-600 text-sm">
                You have granted access to the following assets:
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-3">
                {oauthConfirmation.assets.map((asset, index) => (
                  <div key={asset.id} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-600">{asset.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setOauthConfirmation(null);
                  // Move to next platform or complete if all done
                  if (currentPlatformIndex < platforms.length - 1) {
                    setCurrentPlatformIndex(currentPlatformIndex + 1);
                  } else if (allPlatformsConnected()) {
                    setCurrentStep('complete');
                  }
                }}
                className="gradient-primary"
                size="lg"
              >
                Continue to Next Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
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
            <p className="text-gray-600 text-sm mb-6">
              Thank you for connecting your platforms. You'll be redirected to your dashboard shortly.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  // Redirect to client dashboard
                  window.location.href = '/client';
                }}
                className="gradient-primary"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
