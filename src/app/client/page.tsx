'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface OnboardingRequest {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  submitted_at: string;
  platforms: string[];
  permissions: Record<string, string[]>;
}

export default function ClientDashboardPage() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user data - replace with real auth
  const user = {
    name: 'Client User',
    email: 'client@example.com',
    role: 'client' as const,
  };

  useEffect(() => {
    // TODO: Fetch real client requests from API
    // For now, using mock data
    setTimeout(() => {
      setRequests([
        {
          id: '1',
          status: 'completed',
          submitted_at: '2024-01-15T10:30:00Z',
          platforms: ['meta', 'google'],
          permissions: {
            meta: ['pages_read_engagement', 'pages_manage_posts'],
            google: ['analytics.readonly']
          }
        },
        {
          id: '2',
          status: 'in_progress',
          submitted_at: '2024-01-20T14:15:00Z',
          platforms: ['tiktok'],
          permissions: {
            tiktok: ['user.info.basic', 'video.list']
          }
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your onboarding requests and platform connections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Onboarding Requests</span>
                </CardTitle>
                <CardDescription>
                  Track the status of your platform access requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading requests...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                    <p className="text-gray-600 mb-4">
                      You haven&apos;t submitted any onboarding requests yet.
                    </p>
                    <Button asChild>
                      <Link href="/client/requests">View Requests</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            <span className="font-medium">Request #{request.id}</span>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Submitted: {formatDate(request.submitted_at)}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-gray-700">Platforms:</span>
                            <div className="flex flex-wrap gap-2">
                              {request.platforms.map((platform) => (
                                <Badge key={platform} variant="outline" className="text-xs">
                                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                </Badge>
                              ))}
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
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/client/requests">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Requests
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/client/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <p className="text-sm text-gray-600">{user.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Role:</span>
                  <Badge variant="outline" className="ml-2">
                    {user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Request Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {requests.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {requests.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
