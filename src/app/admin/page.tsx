'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Globe,
  Store,
  BarChart3,
  Settings,
  TrendingUp,
  ArrowRight,
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

const statCards = [
  {
    key: 'totalClients',
    label: 'Total Clients',
    sublabel: 'Active accounts',
    icon: Users,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    delay: 0.05,
  },
  {
    key: 'activeLinks',
    label: 'Active Links',
    sublabel: 'Onboarding links',
    icon: LinkIcon,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    delay: 0.1,
  },
  {
    key: 'completedOnboardings',
    label: 'Completed',
    sublabel: 'Finished onboardings',
    icon: CheckCircle,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    delay: 0.15,
  },
  {
    key: 'pendingRequests',
    label: 'Pending',
    sublabel: 'Awaiting action',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    delay: 0.2,
  },
] as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeLinks: 0,
    completedOnboardings: 0,
    pendingRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const [clientsRes, linksRes, connectionsRes, activityRes] = await Promise.all([
        fetch('/api/clients/detailed'),
        fetch('/api/admin/links'),
        fetch('/api/admin/platform-connections/assets'),
        fetch('/api/admin/recent-activity'),
      ]);

      const clientsData = await clientsRes.json();
      const linksData = await linksRes.json();
      const connectionsData = await connectionsRes.json();

      const totalClients = clientsData.clients?.length || 0;
      const activeLinks = linksData.links?.length || 0;
      const completedOnboardings = clientsData.clients?.filter(
        (c: any) => c.status === 'active' || c.last_onboarding_at
      ).length || 0;
      const pendingRequests = clientsData.clients?.filter(
        (c: any) => c.status === 'pending' || !c.last_onboarding_at
      ).length || 0;

      setStats({ totalClients, activeLinks, completedOnboardings, pendingRequests });
      setPlatformConnections(connectionsData.connections || []);

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'onboarding_completed':  return <CheckCircle className="h-3.5 w-3.5" />;
      case 'platform_connected':    return <LinkIcon className="h-3.5 w-3.5" />;
      case 'link_generated':        return <LinkIcon className="h-3.5 w-3.5" />;
      case 'client_created':        return <Users className="h-3.5 w-3.5" />;
      case 'connection_established': return <TrendingUp className="h-3.5 w-3.5" />;
      default:                      return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const getPlatformLogo = (platformId: string) => {
    const logoMap: Record<string, string> = {
      meta: '/logos/meta.png',
      facebook: '/logos/meta.png',
      google: '/logos/google.png',
      tiktok: '/logos/tiktok.webp',
      shopify: '/logos/shopify.webp',
    };
    const logoPath = logoMap[platformId.toLowerCase()];
    return logoPath ? (
      <Image src={logoPath} alt={platformId} width={20} height={20} className="object-contain" />
    ) : (
      <Globe className="h-5 w-5 text-gray-400" />
    );
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'ad_account':
      case 'ads_account':    return <BarChart3 className="h-3.5 w-3.5" />;
      case 'store':          return <Store className="h-3.5 w-3.5" />;
      default:               return <Globe className="h-3.5 w-3.5" />;
    }
  };

  const statsValues: Record<string, number> = {
    totalClients: stats.totalClients,
    activeLinks: stats.activeLinks,
    completedOnboardings: stats.completedOnboardings,
    pendingRequests: stats.pendingRequests,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8 p-6 md:p-8">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back — here's what's happening with your platform.
            </p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="icon"
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ key, label, sublabel, icon: Icon, iconBg, iconColor, delay }) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.3 }}
            >
              <Card className="hover:shadow-card-hover transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                        {label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 tabular-nums">
                        {statsValues[key]}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">{sublabel}</p>
                    </div>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ml-4`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity + Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events across your platform</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Events will appear here as they happen</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        index === 0 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{activity.description}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                {[
                  {
                    label: 'Generate Link',
                    description: 'Create a new onboarding link',
                    icon: LinkIcon,
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    onClick: () => router.push('/admin/links?openDialog=true'),
                  },
                  {
                    label: 'View Clients',
                    description: 'Browse your client roster',
                    icon: Users,
                    iconBg: 'bg-blue-50',
                    iconColor: 'text-blue-600',
                    onClick: () => router.push('/admin/clients'),
                  },
                  {
                    label: 'Connections',
                    description: 'Manage platform integrations',
                    icon: Globe,
                    iconBg: 'bg-violet-50',
                    iconColor: 'text-violet-600',
                    onClick: () => router.push('/admin/settings'),
                  },
                ].map(({ label, description, icon: Icon, iconBg, iconColor, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-200 bg-white
                               hover:border-gray-300 hover:shadow-card-hover transition-all duration-150 text-left group"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Connections</CardTitle>
            <CardDescription>Your connected advertising and analytics platforms</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {platformConnections.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {platformConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm">
                      {getPlatformLogo(connection.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{connection.name}</p>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs shrink-0 ml-2">
                          Connected
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 truncate">@{connection.username}</p>
                      <div className="flex flex-wrap gap-1">
                        {connection.scopes?.slice(0, 3).map((scope, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium">
                            {scope.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {(connection.scopes?.length || 0) > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px]">
                            +{connection.scopes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No platform connections</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Connect to platforms in Settings to see them here</p>
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/settings')}>
                  Go to Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
