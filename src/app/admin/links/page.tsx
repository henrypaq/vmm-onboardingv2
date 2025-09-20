'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnhancedLinkGeneratorForm } from '@/components/forms/enhanced-link-generator-form';
import { Copy, ExternalLink, Trash2, RefreshCw } from 'lucide-react';

interface OnboardingLink {
  id: string;
  admin_id: string;
  client_id?: string;
  link_name?: string;
  token: string;
  platforms: string[];
  requested_permissions: Record<string, string[]>;
  expires_at: string;
  status: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<OnboardingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch links from API
  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/links');
      const data = await response.json();
      
      if (response.ok) {
        setLinks(data.links || []);
      } else {
        console.error('Error fetching links:', data.error);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch links on component mount
  useEffect(() => {
    fetchLinks();
  }, []);

  const handleLinkGenerated = (link: { url: string; token: string; platforms: string[]; requestedScopes: Record<string, string[]> }) => {
    // Refresh the links list to include the newly generated link
    fetchLinks();
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(linkId);
      const response = await fetch(`/api/admin/links?id=${linkId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the deleted link from the local state
        setLinks(prev => prev.filter(link => link.id !== linkId));
      } else {
        const data = await response.json();
        console.error('Error deleting link:', data.error);
        alert('Failed to delete link. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  const getStatusVariant = (isUsed: boolean, expiresAt: string) => {
    if (isUsed) return 'secondary';
    if (new Date(expiresAt) < new Date()) return 'destructive';
    return 'default';
  };

  const getStatusText = (isUsed: boolean, expiresAt: string) => {
    if (isUsed) return 'Used';
    if (new Date(expiresAt) < new Date()) return 'Expired';
    return 'Active';
  };

  const getOnboardingUrl = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
    return `${baseUrl}/onboarding/${token}`;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Links</h1>
        <p className="text-gray-600 mt-2">Generate and manage client onboarding links</p>
      </div>
      
      <div className="space-y-6">
        {/* Link Generator */}
        <EnhancedLinkGeneratorForm onLinkGenerated={handleLinkGenerated} />

        {/* Links List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Links</CardTitle>
                <CardDescription>
                  All generated onboarding links and their status
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLinks}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading links...</span>
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No links generated yet.</p>
                <p className="text-sm mt-1">Create your first onboarding link above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">
                            {link.link_name || 'Unnamed Link'}
                          </h3>
                          <p className="text-sm text-gray-500">Token: {link.token}</p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(link.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            Platforms: {link.platforms.join(', ')}
                          </p>
                          {link.client_id && (
                            <p className="text-xs text-gray-400">
                              Client: {link.client_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusVariant(link.is_used, link.expires_at)}>
                        {getStatusText(link.is_used, link.expires_at)}
                      </Badge>
                      <div className="text-right text-sm text-gray-500">
                        <p>Expires: {new Date(link.expires_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(getOnboardingUrl(link.token))}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(getOnboardingUrl(link.token), '_blank')}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteLink(link.id)}
                          disabled={isDeleting === link.id}
                          title="Delete link"
                        >
                          {isDeleting === link.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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
  );
}