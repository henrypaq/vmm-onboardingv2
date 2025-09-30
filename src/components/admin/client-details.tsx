'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { X, ExternalLink, RefreshCw, Calendar, User, Building, Mail, Link as LinkIcon, TestTube } from 'lucide-react';

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
    try {
      console.log(`[API Test] Testing ${platform} access for ${assetType}:`, assetId);
      
      const endpoint = platform === 'meta' ? '/api/test/meta-access' : '/api/test/google-access';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientId,
          platform: platform,
          assetId: assetId,
          assetType: assetType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        let successMessage = data.message;
        
        // Add specific asset data to success message
        if (data.assetData) {
          if (platform === 'meta') {
            if (assetType === 'ad_account' && data.assetData.campaigns) {
              const campaignList = data.assetData.campaigns.length > 0 
                ? data.assetData.campaigns.map((c: any) => c.name).join(', ')
                : 'No campaigns found';
              successMessage += ` - Campaigns: ${campaignList}`;
            } else if (assetType === 'page' && data.assetData.name) {
              successMessage += ` - Page: ${data.assetData.name} (${data.assetData.followersCount} followers)`;
            } else if (assetType === 'catalog' && data.assetData.name) {
              successMessage += ` - Catalog: ${data.assetData.name} (${data.assetData.productCount} products)`;
            }
          } else if (platform === 'google') {
            if (assetType === 'analytics_property' && data.assetData.accounts) {
              const accountList = data.assetData.accounts.map((a: any) => a.name).join(', ');
              successMessage += ` - Accounts: ${accountList}`;
            } else if (data.assetData.accountId) {
              successMessage += ` - Account ID: ${data.assetData.accountId}`;
            }
          }
        }
        
        showToast({
          type: 'success',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Successful`,
          message: successMessage
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
      showToast({
        type: 'error',
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} API Test Failed`,
        message: 'Network error or server unavailable'
      });
    }
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
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
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
                            {onboardingRequest.platform_connections[connection.platform].assets.map((asset: Asset, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <div>
                                  <span className="text-sm font-medium">{asset.name}</span>
                                  <span className="text-xs text-gray-500 ml-2 capitalize">({asset.type})</span>
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
                                  >
                                    <TestTube className="h-3 w-3 mr-1" />
                                    Test API
                                  </Button>
                                </div>
                              </div>
                            ))}
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
