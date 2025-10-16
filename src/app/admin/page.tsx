'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Link as LinkIcon, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  RefreshCw,
  Globe,
  Store,
  BarChart3,
  Settings,
  MoreHorizontal,
  DollarSign,
  FileText,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalClients: number;
  activeLinks: number;
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeLinks: 0,
    completedOnboardings: 0,
    pendingRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch actual client data
      const clientsResponse = await fetch('/api/clients/detailed');
      const clientsData = await clientsResponse.json();
      const totalClients = clientsData.clients?.length || 0;

      // Fetch links
      const linksResponse = await fetch('/api/admin/links');
      const linksData = await linksResponse.json();
      const activeLinks = linksData.links?.length || 0;

      // Calculate completed and pending onboardings from actual data
      const completedOnboardings = clientsData.clients?.filter((client: any) => 
        client.status === 'active' || client.last_onboarding_at
      ).length || 0;
      
      const pendingRequests = clientsData.clients?.filter((client: any) => 
        client.status === 'pending' || !client.last_onboarding_at
      ).length || 0;

      // Fetch platform connections with assets
      const connectionsResponse = await fetch('/api/admin/platform-connections/assets');
      const connectionsData = await connectionsResponse.json();
      const connections = connectionsData.connections || [];

      setStats({
        totalClients,
        activeLinks,
        completedOnboardings,
        pendingRequests
      });

      setPlatformConnections(connections);

      // Fetch real recent activity
      const activityResponse = await fetch('/api/admin/recent-activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'onboarding_completed': return <CheckCircle className="h-4 w-4" />;
      case 'platform_connected': return <LinkIcon className="h-4 w-4" />;
      case 'link_generated': return <LinkIcon className="h-4 w-4" />;
      case 'client_created': return <Users className="h-4 w-4" />;
      case 'connection_established': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getPlatformLogo = (platformId: string) => {
    const logoMap: { [key: string]: string } = {
      'meta': '/logos/meta.png',
      'facebook': '/logos/meta.png',
      'google': '/logos/google.png',
      'tiktok': '/logos/tiktok.webp',
      'shopify': '/logos/shopify.webp',
    };

    const logoPath = logoMap[platformId.toLowerCase()];
    
    if (logoPath) {
      return (
        <Image 
          src={logoPath} 
          alt={platformId} 
          width={24} 
          height={24}
          className="object-contain"
        />
      );
    }
    
    return <Globe className="h-6 w-6" />;
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'page':
      case 'business_account':
      case 'analytics_property':
        return <Globe className="h-4 w-4" />;
      case 'ad_account':
      case 'ads_account':
        return <BarChart3 className="h-4 w-4" />;
      case 'store':
        return <Store className="h-4 w-4" />;
      case 'instagram':
        return <Globe className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl page-title tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500">
                  <LinkIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Links</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeLinks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedOnboardings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity and Quick Actions - Side by Side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] overflow-hidden">
            <div className="relative h-full">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-200"></div>
              
              <div className="h-full overflow-y-auto pr-2 space-y-6">
                {recentActivity.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={activity.id} className="relative flex items-start space-x-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${
                        index === 0 
                          ? 'bg-purple-500' 
                          : 'bg-white border-2 border-purple-200'
                      }`}>
                        <div className={`${
                          index === 0 ? 'text-white' : 'text-purple-500'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      
                      {/* Activity content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 ml-4">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 h-full">
              <Button 
                className="h-20 justify-center flex-col rounded-2xl gradient-generate border-0 shadow-lg hover:shadow-xl transition-all duration-200" 
                variant="outline"
                onClick={() => {
                  router.push('/admin/links?openDialog=true');
                }}
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-6 w-6 text-black" />
                  <span className="text-base font-medium text-black">Generate Link</span>
                  <ArrowRight className="h-4 w-4 text-black" />
                </div>
              </Button>
              <Button 
                className="h-20 justify-center flex-col rounded-2xl gradient-clients border-0 shadow-lg hover:shadow-xl transition-all duration-200" 
                variant="outline"
                onClick={() => router.push('/admin/clients')}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-black" />
                  <span className="text-base font-medium text-black">View Clients</span>
                  <ArrowRight className="h-4 w-4 text-black" />
                </div>
              </Button>
              <Button 
                className="h-20 justify-center flex-col rounded-2xl gradient-connections border-0 shadow-lg hover:shadow-xl transition-all duration-200" 
                variant="outline"
                onClick={() => {
                  // Trigger settings dialog via custom event
                  window.dispatchEvent(new CustomEvent('openSettings'));
                }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-black" />
                  <span className="text-base font-medium text-black">Connections</span>
                  <ArrowRight className="h-4 w-4 text-black" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections Breakdown */}
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Platform Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {platformConnections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformConnections.map((connection) => (
                  <div key={connection.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                          {getPlatformLogo(connection.platform)}
                        </div>
                        <div>
                          <h3 className="font-medium">{connection.name}</h3>
                          <p className="text-sm text-gray-500">
                            Connected as {connection.username}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    </div>
                    
                    {/* Assets */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Available Assets:</h4>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {connection.assets.map((asset) => (
                          <div key={asset.id} className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md">
                            <div className="text-gray-500">
                              {getAssetIcon(asset.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{asset.name}</p>
                              <p className="text-xs text-gray-500 capitalize">
                                {asset.type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500">No platform connections found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Connect to platforms to see available assets
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}