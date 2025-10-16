'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Link as LinkIcon, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Globe,
  Store,
  BarChart3,
  Settings,
  MoreHorizontal,
  DollarSign,
  FileText,
  Briefcase,
  ArrowRight,
  ExternalLink,
  Calendar,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';

interface DashboardStats {
  totalConnections: number;
  activePlatforms: number;
  completedOnboardings: number;
  pendingRequests: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  metadata?: any;
}

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
  const [stats, setStats] = useState<DashboardStats>({
    totalConnections: 0,
    activePlatforms: 0,
    completedOnboardings: 0,
    pendingRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch client's platform connections
      const connectionsResponse = await fetch('/api/client/connections');
      const connectionsData = await connectionsResponse.json();
      const connections = connectionsData.connections || [];

      // Calculate stats from actual data
      const totalConnections = connections.length;
      const activePlatforms = connections.filter((conn: any) => conn.is_active).length;
      const completedOnboardings = connections.filter((conn: any) => conn.is_active).length;
      const pendingRequests = connections.filter((conn: any) => !conn.is_active).length;

      setStats({
        totalConnections,
        activePlatforms,
        completedOnboardings,
        pendingRequests
      });

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

      // Generate recent activity from connections
      const activity = connections.map((conn: any) => ({
        id: conn.id,
        type: 'connection',
        title: `${conn.platform} Connected`,
        description: `Successfully connected to ${conn.platform}`,
        timestamp: conn.created_at,
        icon: conn.platform,
        metadata: { platform: conn.platform, username: conn.platform_username }
      })).slice(0, 5);

      setRecentActivity(activity);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'request':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const statCards = [
    {
      title: 'Total Connections',
      value: stats.totalConnections,
      icon: LinkIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Platform connections'
    },
    {
      title: 'Active Platforms',
      value: stats.activePlatforms,
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Currently connected'
    },
    {
      title: 'Completed Onboardings',
      value: stats.completedOnboardings,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Successfully onboarded'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Awaiting completion'
    }
  ];

  const quickActions = [
    {
      title: 'Account Settings',
      description: 'Update your profile and preferences',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      href: '/client/settings'
    },
    {
      title: 'Support',
      description: 'Get help with your connections',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      href: '#'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">View your connected platforms and assets</p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          className="hover:bg-primary/10 hover:border-primary/30"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Connections */}
        <div className="lg:col-span-2">
          <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <LinkIcon className="h-5 w-5 mr-2 text-primary" />
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

                      {/* Floating Assets */}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Account & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    onClick={() => {
                      if (action.href !== '#') {
                        window.location.href = action.href;
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                    </div>
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                      </div>
                    </motion.div>
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