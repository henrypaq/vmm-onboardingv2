'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, RefreshCw, Calendar, User, Building, Mail, Link as LinkIcon } from 'lucide-react';

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
              {onboardingRequest && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Onboarding Link Used</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {onboardingRequest.link.token.substring(0, 8)}...
                    </Badge>
                    {onboardingRequest.link.link_name && (
                      <p className="text-sm text-gray-600 mt-1">{onboardingRequest.link.link_name}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Connections */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-2" />
                Platform Connections
              </CardTitle>
              <CardDescription>
                Connected platforms and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformConnections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No platform connections found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This client hasn't connected any platforms yet
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

          {/* Onboarding Request Details */}
          {onboardingRequest && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Onboarding Request Details
                </CardTitle>
                <CardDescription>
                  Information about the onboarding request that created this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Request Status</label>
                    <p className="text-lg capitalize">{onboardingRequest.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted At</label>
                    <p className="text-lg">
                      {onboardingRequest.submitted_at ? formatDate(onboardingRequest.submitted_at) : 'Not submitted'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
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
              </CardContent>
            </Card>
          )}
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
