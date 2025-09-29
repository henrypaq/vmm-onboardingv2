'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mountain, Users, User, Settings, Link as LinkIcon, FileText, ExternalLink, RefreshCw } from 'lucide-react';

interface DemoLink {
  token: string;
  link_name: string;
  platforms: string[];
  requested_permissions: Record<string, string[]>;
  expires_at: string;
}

export default function HomePage() {
  const [demoLink, setDemoLink] = useState<DemoLink | null>(null);
  const [demoUrl, setDemoUrl] = useState<string>('');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const fetchDemoLink = async () => {
    try {
      setIsLoadingDemo(true);
      setDemoError(null);
      
      console.log('[HomePage] Fetching demo link...');
      const response = await fetch('/api/demo-link');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch demo link');
      }
      
      const data = await response.json();
      console.log('[HomePage] Demo link data:', data);
      
      setDemoLink(data.link);
      setDemoUrl(data.demoUrl);
    } catch (error) {
      console.error('[HomePage] Error fetching demo link:', error);
      setDemoError(error instanceof Error ? error.message : 'Failed to fetch demo link');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  useEffect(() => {
    fetchDemoLink();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-lg">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">VAST</span>
          </div>
          <div className="text-sm text-gray-500">
            Onboarding Platform
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to VAST Onboarding Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your client onboarding process with our comprehensive platform. 
            Generate secure links, manage permissions, and track progress all in one place.
          </p>
        </div>

        {/* Dashboard Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Admin Dashboard</CardTitle>
                  <CardDescription>Manage clients, generate links, and oversee onboarding</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Client Management</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <LinkIcon className="h-4 w-4" />
                  <span>Link Generation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Platform Settings</span>
                </div>
              </div>
              <Link href="/admin" className="block">
                <Button className="w-full">
                  Access Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Client Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Client Dashboard</CardTitle>
                  <CardDescription>View requests, submit permissions, and track status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Request Management</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Profile Settings</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Account Settings</span>
                </div>
              </div>
              <Link href="/client" className="block">
                <Button className="w-full" variant="outline">
                  Access Client Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Demo Link Connect Flow */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Demo: Client Onboarding Flow
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the client onboarding process. Click the demo link below to see how clients 
              grant permissions when they receive an onboarding invitation.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Demo Onboarding Link</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Simulate a client clicking on an onboarding invitation
                  </p>
                  {demoLink && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p>Token: {demoLink.token.substring(0, 8)}...</p>
                      <p>Platforms: {demoLink.platforms.join(', ')}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center space-y-2">
                  {isLoadingDemo ? (
                    <Button disabled className="bg-blue-600">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading Demo...
                    </Button>
                  ) : demoError ? (
                    <div className="text-center">
                      <Button onClick={fetchDemoLink} variant="outline" className="mb-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                      <p className="text-xs text-red-500">{demoError}</p>
                    </div>
                  ) : demoUrl ? (
                    <Link href={demoUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Start Demo Flow
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={fetchDemoLink} className="bg-blue-600 hover:bg-blue-700">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Create Demo Link
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Getting Started
            </h2>
            <p className="text-gray-600 mb-6">
              Choose your role above to access the appropriate dashboard. 
              Admins can manage clients and generate onboarding links, 
              while clients can view their requests and submit permissions.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>• Secure link generation</span>
              <span>• Permission management</span>
              <span>• Real-time tracking</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}