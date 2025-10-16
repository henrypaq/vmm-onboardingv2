'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, RefreshCw, Calendar, User, Building, Mail, Link as LinkIcon, TestTube, Copy, Check, Globe, Loader2 } from 'lucide-react';

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
  const [apiTestLoading, setApiTestLoading] = useState<Record<string, boolean>>({});
  const [isTestingAllAssets, setIsTestingAllAssets] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string> | null>(null);

  const testAllAssets = async () => {
    try {
      setIsTestingAllAssets(true);
      setTestResults(null);
      
      const response = await fetch('/api/admin/test-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const results = await response.json();
      setTestResults(results);
      
      // Show appropriate banner based on results
      const allOk = Object.values(results).every(status => status === 'ok');
      const anyFail = Object.values(results).some(status => status === 'fail');
      
      if (allOk) {
        toast.success('All client assets are connected and functioning correctly.');
      } else if (anyFail) {
        toast.error('Some client assets could not be verified. Check tokens or permissions.');
      }
      
    } catch (error) {
      console.error('[Client Details] Error testing assets:', error);
      toast.warning('Asset test unavailable — please try again later.');
    } finally {
      setIsTestingAllAssets(false);
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
      
      // Fetch onboarding request
      const requestResponse = await fetch(`/api/clients/${clientId}/onboarding-request`);
      if (requestResponse.ok) {
        const requestData = await requestResponse.json();
        setOnboardingRequest(requestData.request);
      }
      
    } catch (err) {
      console.error('[Client Details] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch client details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      fetchClientDetails();
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
    return logoMap[platformId.toLowerCase()] || '/logos/meta.png';
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

  const testPlatformAPI = async (platform: string, connection: PlatformConnection) => {
    const testKey = `${platform}_${connection.id}`;
    setApiTestLoading(prev => ({ ...prev, [testKey]: true }));
    
    try {
      const response = await fetch(`/api/test/${platform}-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          connectionId: connection.id
        })
      });
      
      const data = await response.json();
      
      if (data.success || data.ok) {
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Successful`, {
          description: data.summary || 'Connection is working properly'
        });
      } else {
        toast.error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Failed`, {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error(`[${platform} Test] Error:`, error);
      toast.error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Failed`, {
        description: 'Network error or server unavailable'
      });
    } finally {
      setApiTestLoading(prev => ({ ...prev, [testKey]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-xl border border-gray-200">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Loading client details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-xl border border-gray-200">
          <div className="text-center py-12">
            <p className="text-red-600 mb-6 text-lg">{error || 'Client not found'}</p>
            <Button onClick={onClose} variant="outline" className="hover:bg-primary/10 hover:border-primary/30">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl page-title tracking-tight">Client Details</h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-gray-100">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-gray-900">{client.full_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-lg text-gray-900">{client.email}</p>
              </div>
              <div>
                <p className="text-lg text-gray-900">{client.company_name || 'Not provided'}</p>
              </div>
              <div>
                <Badge variant={getStatusVariant(client.status)} className="text-sm px-3 py-1">
                  {client.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Connection Information */}
          <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Connection Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-lg text-gray-900">{formatDate(client.created_at)}</p>
              </div>
              <div>
                <p className="text-lg text-gray-900">
                  {client.last_onboarding_at ? formatDate(client.last_onboarding_at) : 'Never'}
                </p>
              </div>
              <div>
                {onboardingRequest?.link ? (
                  <div className="space-y-2">
                    <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                      {onboardingRequest.link.token.substring(0, 12)}...
                    </Badge>
                    {onboardingRequest.link.link_name && (
                      <p className="text-sm text-gray-600">{onboardingRequest.link.link_name}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No onboarding request recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Platform Connections */}
          <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <LinkIcon className="h-5 w-5 mr-2 text-primary" />
                  Platform Connections
                </CardTitle>
                <Button
                  onClick={testAllAssets}
                  disabled={isTestingAllAssets || platformConnections.length === 0}
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  {isTestingAllAssets ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing connections...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test All Assets
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {platformConnections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No platform connections found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {platformConnections.map((connection) => (
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50">
                            <Image
                              src={getPlatformLogo(connection.platform)}
                              alt={connection.platform}
                              width={24}
                              height={24}
                              className="rounded"
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg capitalize text-gray-900">{connection.platform}</h4>
                            <p className="text-sm text-gray-500">@{connection.platform_username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={connection.is_active ? "default" : "secondary"}
                            className={`text-sm px-3 py-1 ${connection.is_active ? "bg-green-100 text-green-800" : ""}`}
                          >
                            {connection.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testPlatformAPI(connection.platform, connection)}
                            disabled={apiTestLoading[`${connection.platform}_${connection.id}`]}
                            className="hover:bg-primary/10 hover:border-primary/30"
                          >
                            {apiTestLoading[`${connection.platform}_${connection.id}`] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                            <span className="ml-2">Test API</span>
                          </Button>
                        </div>
                      </div>
                      
                      {connection.scopes && connection.scopes.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {connection.scopes.map((scope, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display assets from client platform connection if available */}
                      {(() => {
                        const assets = connection.assets;
                        return connection.platform === 'google' || (assets && assets.length > 0);
                      })() ? (
                        <div>
                          <div className="space-y-2">
                            {connection.assets?.map((asset: Asset, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{asset.name}</p>
                                  <p className="text-xs text-gray-500 capitalize">{asset.type.replace('_', ' ')}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {asset.id}
                                </Badge>
                              </div>
                            )) || (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">No assets available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}