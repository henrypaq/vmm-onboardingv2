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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchDashboardData} size="sm" className="ultra-minimal-icon-button" disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="modern-card group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                    <p className="text-xs text-green-600 font-medium">+12% from last month</p>
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
            <Card className="modern-card group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <LinkIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Links</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeLinks}</p>
                    <p className="text-xs text-emerald-600 font-medium">+8% from last month</p>
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
            <Card className="modern-card group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completedOnboardings}</p>
                    <p className="text-xs text-purple-600 font-medium">+15% from last month</p>
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
            <Card className="modern-card group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
                    <p className="text-xs text-amber-600 font-medium">Needs attention</p>
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
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="h-16 justify-center flex-col bg-white/60 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all duration-300" 
                onClick={() => {
                  router.push('/admin/links?openDialog=true');
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Generate Link</span>
                </div>
              </Button>
              <Button 
                className="h-16 justify-center flex-col bg-white/60 border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-300" 
                onClick={() => router.push('/admin/clients')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">View Clients</span>
                </div>
              </Button>
              <Button 
                className="h-16 justify-center flex-col bg-white/60 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md transition-all duration-300" 
                onClick={() => {
                  // Trigger settings dialog via custom event
                  window.dispatchEvent(new CustomEvent('openSettings'));
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Connections</span>
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
                    
                    {/* Scopes */}
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Available permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {connection.scopes && connection.scopes.length > 0 ? (
                          <>
                            {connection.scopes.slice(0, 3).map((scope, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {scope.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            ))}
                            {connection.scopes.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{connection.scopes.length - 3} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No permissions granted
                          </Badge>
                        )}
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
    </div>
  );
}