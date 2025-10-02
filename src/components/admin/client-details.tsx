'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { X, ExternalLink, RefreshCw, Calendar, User, Building, Mail, Link as LinkIcon, TestTube, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface ClientDetails {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  status: 'active' | 'inactive' | 'suspended';
  last_onboarding_at: string | null;
  created_at: string;
  updated_at: string;
  admin_id: string;
}

interface PlatformConnection {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_username: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
}

interface OnboardingRequest {
  id: string;
  link_id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  company_name: string;
  granted_permissions: Record<string, string[]>;
  platform_connections: Record<string, any>;
  status: string;
  submitted_at: string;
  created_at: string;
  link: {
    id: string;
    token: string;
    link_name: string;
    platforms: string[];
    requested_permissions: Record<string, string[]>;
    created_at: string;
  };
}

interface ClientDetailsPanelProps {
  clientId: string;
  onClose: () => void;
}

export function ClientDetailsPanel({ clientId, onClose }: ClientDetailsPanelProps) {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [onboardingRequest, setOnboardingRequest] = useState<OnboardingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for API test responses
  const [apiTestResults, setApiTestResults] = useState<Record<string, any>>({});
  const [apiTestLoading, setApiTestLoading] = useState<Record<string, boolean>>({});
  const [apiTestExpanded, setApiTestExpanded] = useState<Record<string, boolean>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isDebuggingPages, setIsDebuggingPages] = useState(false);
  const [isGettingToken, setIsGettingToken] = useState(false);
  const [isComprehensiveDebugging, setIsComprehensiveDebugging] = useState(false);
  const [isTestingFetchAssets, setIsTestingFetchAssets] = useState(false);

  const testFetchAssets = async () => {
    try {
      setIsTestingFetchAssets(true);
      console.log('[Client Details] Testing fetchPlatformAssets for client:', clientId);
      
      // Get the client's access token from platform connections
      const metaConnection = platformConnections.find(conn => conn.platform === 'meta');
      if (!metaConnection) {
        throw new Error('No Meta connection found for this client');
      }
      
      const response = await fetch('/api/debug/test-fetch-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaConnection.access_token,
          scopes: metaConnection.scopes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Test fetch assets failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Client Details] Test fetch assets result:', result);
      
      // Show results in alert for now
      const breakdown = result.assetBreakdown;
      alert(`Test Fetch Assets Results:

Ad Accounts: ${breakdown.ad_accounts}
Pages: ${breakdown.pages}
Catalogs: ${breakdown.catalogs}
Business Datasets: ${breakdown.business_datasets}
Instagram Accounts: ${breakdown.instagram_accounts}
Total: ${breakdown.total}

Check console for detailed results.`);
      
    } catch (error) {
      console.error('[Client Details] Error testing fetch assets:', error);
      alert(`Error testing fetch assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingFetchAssets(false);
    }
  };

  const comprehensiveDebugPages = async () => {
    try {
      setIsComprehensiveDebugging(true);
      console.log('[Client Details] Comprehensive debugging pages for client:', clientId);
      
      // Get the client's access token from platform connections
      const metaConnection = platformConnections.find(conn => conn.platform === 'meta');
      if (!metaConnection) {
        throw new Error('No Meta connection found for this client');
      }
      
      const response = await fetch('/api/debug/comprehensive-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaConnection.access_token,
          scopes: metaConnection.scopes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Comprehensive debug failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Client Details] Comprehensive debug result:', result);
      
      // Show results in alert for now
      const summary = result.results.summary;
      alert(`Comprehensive Pages Debug Results:

Token Valid: ${summary.tokenValid ? 'Yes' : 'No'}
Has Pages Scopes: ${summary.hasPagesScopes ? 'Yes' : 'No'}
Primary Method Pages: ${summary.primaryMethodPages}
Granular Scopes Found: ${summary.granularScopesFound}
Direct Page Query Success: ${summary.directPageQuerySuccess ? 'Yes' : 'No'}
Total Pages Found: ${summary.totalPagesFound}

Check console for detailed results.`);
      
    } catch (error) {
      console.error('[Client Details] Error comprehensive debugging pages:', error);
      alert(`Error comprehensive debugging pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsComprehensiveDebugging(false);
    }
  };

  const getToken = async () => {
    try {
      setIsGettingToken(true);
      console.log('[Client Details] Getting token for client:', clientId);
      
      const response = await fetch(`/api/debug/get-token/${clientId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get token: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Client Details] Token result:', result);
      
      // Show token in alert for easy copying
      alert(`Access Token for Meta API Testing:

${result.token}

Token Info:
- Platform: ${result.platform}
- User ID: ${result.platformUserId}
- Username: ${result.platformUsername}
- Scopes: ${result.scopes?.join(', ')}
- Expires: ${result.tokenExpiresAt}

Copy the token above and test it with Meta's API directly.`);
      
    } catch (error) {
      console.error('[Client Details] Error getting token:', error);
      alert(`Error getting token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGettingToken(false);
    }
  };

  const debugPages = async () => {
    try {
      setIsDebuggingPages(true);
      console.log('[Client Details] Debugging pages for client:', clientId);
      
      // Get the client's access token from platform connections
      const metaConnection = platformConnections.find(conn => conn.platform === 'meta');
      if (!metaConnection) {
        throw new Error('No Meta connection found for this client');
      }
      
      const response = await fetch('/api/debug/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaConnection.access_token,
          scopes: metaConnection.scopes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Debug failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Client Details] Pages debug result:', result);
      
      // Show results in alert for now
      const summary = result.results.summary;
      const tokenTest = result.results.tokenTest;
      alert(`Pages Debug Results:

Token Valid: ${tokenTest?.valid ? 'Yes' : 'No'} (Status: ${tokenTest?.status})
Primary Method: ${summary.primaryPagesFound} pages found
Granular Scopes: ${summary.granularScopesPagesFound} pages found
Fallback Method: ${summary.fallbackPagesFound} pages found
Total: ${summary.totalPagesFound} pages found

Check console for detailed results.`);
      
    } catch (error) {
      console.error('[Client Details] Error debugging pages:', error);
      alert(`Error debugging pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDebuggingPages(false);
    }
  };

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Client Details] Fetching client details for:', clientId);
      
      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (!clientResponse.ok) {
        throw new Error(`Failed to fetch client: ${clientResponse.status}`);
      }
      const clientData = await clientResponse.json();
      setClient(clientData.client);
      
      // Fetch platform connections
      const connectionsResponse = await fetch(`/api/clients/${clientId}/connections`);
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setPlatformConnections(connectionsData.connections || []);
      }
      
      // Fetch onboarding request details
      const requestResponse = await fetch(`/api/clients/${clientId}/onboarding-request`);
      if (requestResponse.ok) {
        const requestData = await requestResponse.json();
        setOnboardingRequest(requestData.request);
      }
      
    } catch (err) {
      console.error('[Client Details] Error fetching client details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch client details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTestApiAccess = async (platform: string, assetId: string, assetType: string) => {
    const testKey = `${platform}-${assetId}-${assetType}`;
    
    try {
      console.log(`[API Test] Testing ${platform} access for ${assetType}:`, assetId);
      
      // Set loading state
      setApiTestLoading(prev => ({ ...prev, [testKey]: true }));
      
      const endpoint = platform === 'meta' ? '/api/meta/test-api' : '/api/test/google-access';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientId,
          assetId: assetId,
          assetType: assetType,
        }),
      });

      const data = await response.json();

      // Store the result
      setApiTestResults(prev => ({ ...prev, [testKey]: data }));
      
      // Auto-expand the result panel
      setApiTestExpanded(prev => ({ ...prev, [testKey]: true }));

      if (response.ok && data.success) {
        showToast({
          type: 'success',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Successful`,
          message: data.description || 'API call completed successfully'
        });
      } else {
        showToast({
          type: 'error',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Failed`,
          message: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error(`[${platform} Test] Error:`, error);
      const errorResult = {
        success: false,
        error: 'Network error or server unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setApiTestResults(prev => ({ ...prev, [testKey]: errorResult }));
      setApiTestExpanded(prev => ({ ...prev, [testKey]: true }));
      
      showToast({
        type: 'error',
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Failed`,
        message: 'Network error or server unavailable'
      });
    } finally {
      // Clear loading state
      setApiTestLoading(prev => ({ ...prev, [testKey]: false }));
    }
  };

  const handleCopyJson = async (testKey: string, jsonData: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setCopiedStates(prev => ({ ...prev, [testKey]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [testKey]: false }));
      }, 2000);
      showToast({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'JSON response copied to clipboard'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy JSON to clipboard'
      });
    }
  };

  const toggleApiTestExpanded = (testKey: string) => {
    setApiTestExpanded(prev => ({ ...prev, [testKey]: !prev[testKey] }));
  };

  const renderApiTestResult = (testKey: string, result: any, assetType: string) => {
    const isExpanded = apiTestExpanded[testKey];
    const isCopied = copiedStates[testKey];
    
    return (
      <div key={testKey} className="border rounded-md bg-white mb-2">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleApiTestExpanded(testKey)}
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium">
              API Response {result.success ? '✅' : '❌'}
            </span>
            <span className="text-xs text-gray-500">
              ({result.description || assetType})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {result.rawJson && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyJson(testKey, result.rawJson || result);
                }}
              >
                {isCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t p-3 bg-gray-50">
            {result.success ? (
              <div>
                <div className="mb-2">
                  <span className="text-xs font-medium text-green-700">API URL:</span>
                  <code className="ml-2 text-xs bg-white px-2 py-1 rounded border">
                    {result.apiUrl || 'N/A'}
                  </code>
                </div>
                {result.humanReadableLabel && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-blue-700">Scope Test:</span>
                    <p className="mt-1 text-xs text-blue-800 bg-blue-50 p-2 rounded border">
                      {result.humanReadableLabel}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-gray-700">Raw JSON Response:</span>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto max-h-60">
                    {JSON.stringify(result.rawJson || result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2">
                  <span className="text-xs font-medium text-red-700">Error:</span>
                  <span className="ml-2 text-xs text-red-600">{result.error}</span>
                </div>
                {result.details && (
                  <div>
                    <span className="text-xs font-medium text-gray-700">Details:</span>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto max-h-40">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'meta':
      case 'facebook':
        return '📘';
      case 'google':
        return '🔍';
      case 'tiktok':
        return '🎵';
      case 'shopify':
        return '🛍️';
      default:
        return '🔗';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'meta':
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      case 'google':
        return 'bg-red-100 text-red-800';
      case 'tiktok':
        return 'bg-black text-white';
      case 'shopify':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading client details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Client not found'}</p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Client Details</h2>
            <p className="text-gray-600">Complete information about this client</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={testFetchAssets} variant="outline" disabled={isTestingFetchAssets}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingFetchAssets ? 'animate-spin' : ''}`} />
              Test Fetch
            </Button>
            <Button onClick={comprehensiveDebugPages} variant="outline" disabled={isComprehensiveDebugging}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isComprehensiveDebugging ? 'animate-spin' : ''}`} />
              Full Debug
            </Button>
            <Button onClick={getToken} variant="outline" disabled={isGettingToken}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isGettingToken ? 'animate-spin' : ''}`} />
              Get Token
            </Button>
            <Button onClick={debugPages} variant="outline" disabled={isDebuggingPages}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isDebuggingPages ? 'animate-spin' : ''}`} />
              Debug Pages
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold">{client.full_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-lg">{client.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-lg">{client.company_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(client.status)}>
                    {client.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Connection Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Created</label>
                <p className="text-lg">{formatDate(client.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Onboarding</label>
                <p className="text-lg">
                  {client.last_onboarding_at ? formatDate(client.last_onboarding_at) : 'Never'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Onboarding Link Used</label>
                <div className="mt-1">
                  {onboardingRequest?.link ? (
                    <>
                      <Badge variant="outline" className="font-mono text-xs">
                        {onboardingRequest.link.token.substring(0, 8)}...
                      </Badge>
                      {onboardingRequest.link.link_name && (
                        <p className="text-sm text-gray-600 mt-1">{onboardingRequest.link.link_name}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No onboarding request recorded for this client yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Connections (permanent records) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-2" />
                Platform Connections
              </CardTitle>
              <CardDescription>
                Connected platforms and their permissions (from client_platform_connections)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformConnections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No platform connections found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This client hasn't connected any platforms yet, or the onboarding flow hasn't been completed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {platformConnections.map((connection) => (
                    <div key={connection.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getPlatformIcon(connection.platform)}</span>
                          <div>
                            <h4 className="font-semibold capitalize">{connection.platform}</h4>
                            <p className="text-sm text-gray-500">@{connection.platform_username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={connection.is_active ? "default" : "secondary"}
                            className={connection.is_active ? "bg-green-100 text-green-800" : ""}
                          >
                            {connection.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {connection.is_active && (
                            <Badge variant="outline" className="text-xs">
                              Test Mode
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {connection.scopes && connection.scopes.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Granted Permissions</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {connection.scopes.map((scope, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display assets from onboarding request if available */}
                      {onboardingRequest?.platform_connections?.[connection.platform]?.assets && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-500">Available Assets</label>
                          <div className="mt-1 space-y-2">
                            {(() => {
                              const assets = onboardingRequest.platform_connections[connection.platform].assets;
                              console.log(`[Client Details] ${connection.platform} assets:`, assets);
                              console.log(`[Client Details] Asset count by type:`, {
                                ad_accounts: assets.filter((a: Asset) => a.type === 'ad_account').length,
                                pages: assets.filter((a: Asset) => a.type === 'page').length,
                                catalogs: assets.filter((a: Asset) => a.type === 'catalog').length,
                                business_datasets: assets.filter((a: Asset) => a.type === 'business_dataset').length,
                                instagram_accounts: assets.filter((a: Asset) => a.type === 'instagram_account').length
                              });
                              return assets;
                            })().map((asset: Asset, index: number) => {
                              const testKey = `${connection.platform}-${asset.id}-${asset.type}`;
                              const pagePostsTestKey = `${connection.platform}-${asset.id}-page_posts`;
                              const isLoading = apiTestLoading[testKey];
                              const isPagePostsLoading = apiTestLoading[pagePostsTestKey];
                              const result = apiTestResults[testKey];
                              const isExpanded = apiTestExpanded[testKey];
                              const isCopied = copiedStates[testKey];

                              return (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                    <div>
                                      <span className="text-sm font-medium">{asset.name}</span>
                                      <span className="text-xs text-gray-500 ml-2 capitalize">
                                        ({asset.type === 'catalog' ? 'Product Catalog' : asset.type === 'ad_account' ? 'Ad Account' : asset.type === 'page' ? 'Page' : asset.type === 'business_dataset' ? 'Business Manager' : asset.type === 'instagram_account' ? 'Instagram Account' : asset.type})
                                      </span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => console.log(`Open ${asset.name} in ${connection.platform}`)}
                                      >
                                        Open in {connection.platform === 'meta' ? 'Meta' : connection.platform === 'google' ? 'Google' : connection.platform}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => handleTestApiAccess(connection.platform, asset.id, asset.type)}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                                        ) : (
                                          <TestTube className="h-3 w-3 mr-1" />
                                        )}
                                        {isLoading ? 'Testing...' : 'Test API'}
                                      </Button>
                                      {/* Additional test for Pages - posts management */}
                                      {connection.platform === 'meta' && asset.type === 'page' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs"
                                          onClick={() => handleTestApiAccess(connection.platform, asset.id, 'page_posts')}
                                          disabled={isPagePostsLoading}
                                        >
                                          {isPagePostsLoading ? (
                                            <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                                          ) : (
                                            <TestTube className="h-3 w-3 mr-1" />
                                          )}
                                          {isPagePostsLoading ? 'Testing...' : 'Test Posts'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* API Test Results Panel */}
                                  <div className="space-y-2">
                                    {result && renderApiTestResult(testKey, result, asset.type)}
                                    {apiTestResults[pagePostsTestKey] && renderApiTestResult(pagePostsTestKey, apiTestResults[pagePostsTestKey], 'page_posts')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-400">
                        <p>Connected: {formatDate(connection.created_at)}</p>
                        {connection.token_expires_at && (
                          <p>Expires: {formatDate(connection.token_expires_at)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Request Details (simplified) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="h-5 w-5 mr-2" />
                Onboarding Request Details
              </CardTitle>
              <CardDescription>
                Link used and permissions granted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {onboardingRequest ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Link Used</label>
                    <div className="mt-1">
                      {onboardingRequest.link?.link_name ? (
                        <p className="text-lg font-medium">{onboardingRequest.link.link_name}</p>
                      ) : (
                        <Badge variant="outline" className="font-mono text-xs">
                          {onboardingRequest.link?.token?.substring(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Granted Permissions</label>
                    <div className="mt-1">
                      {Object.entries(onboardingRequest.granted_permissions).map(([platform, scopes]) => (
                        <div key={platform} className="mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getPlatformIcon(platform)}</span>
                            <span className="font-medium capitalize">{platform}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 ml-6">
                            {scopes.map((scope, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No onboarding request found for this client. The client may have been created manually or not completed the flow.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
