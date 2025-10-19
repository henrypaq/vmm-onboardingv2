'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Link as LinkIcon, 
  RefreshCw,
  Globe,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';

interface PlatformAsset {
  id: string;
  name: string;
  type: string;
  platform: string;
}

interface PlatformConnection {
  id: string;
  name: string;
  username: string;
  status: string;
  platform: string;
  scopes: string[];
  connectedAt: string;
  assets: PlatformAsset[];
}

export default function ClientDashboardPage() {
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch client's platform connections
      const connectionsResponse = await fetch('/api/client/connections');
      const connectionsData = await connectionsResponse.json();
      const connections = connectionsData.connections || [];

      // Transform connections data for display
      const transformedConnections = connections.map((conn: any) => ({
        id: conn.id,
        name: conn.platform,
        username: conn.platform_username,
        status: conn.is_active ? 'active' : 'inactive',
        platform: conn.platform,
        scopes: conn.scopes || [],
        connectedAt: conn.created_at,
        assets: conn.assets || []
      }));

      setPlatformConnections(transformedConnections);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your platform connections and assets</p>
          </div>
          <Button
            onClick={fetchDashboardData}
            size="sm"
            className="gradient-secondary"
          >
            Refresh
          </Button>
        </div>

        {/* Platform Connections - Full Width */}
        <div className="w-full">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-semibold">
                <LinkIcon className="h-6 w-6 mr-3 text-purple-600" />
                Platform Connections
              </CardTitle>
            </CardHeader>
          <CardContent>
            {platformConnections.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven&apos;t connected to any platforms yet.
                </p>
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
                          <p className="text-sm text-gray-500">@{connection.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={connection.status === 'active' ? "default" : "secondary"}
                          className={`text-sm px-3 py-1 ${connection.status === 'active' ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {connection.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    {connection.scopes && connection.scopes.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Granted Permissions</label>
                        <div className="flex flex-wrap gap-2">
                          {connection.scopes.map((scope, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Floating Assets - No Boxes */}
                    {connection.assets && connection.assets.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-3 block">Connected Assets</label>
                        <div className="space-y-2">
                          {connection.assets.map((asset, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{asset.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{asset.type.replace('_', ' ')}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {asset.id}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const platformUrls = {
                                      'google': `https://analytics.google.com/analytics/web/#/p${asset.id}`,
                                      'meta': `https://business.facebook.com/`,
                                      'shopify': `https://${connection.username}.myshopify.com/admin`,
                                      'tiktok': `https://ads.tiktok.com/marketing_api/`
                                    };
                                    const url = platformUrls[connection.platform as keyof typeof platformUrls] || '#';
                                    window.open(url, '_blank');
                                  }}
                                  className="text-xs hover:bg-primary/10 hover:border-primary/30"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open in {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Connected: {formatDate(connection.connectedAt)}
                        </div>
                      </div>
                    </div>
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