'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components 2/ui/card';
import { Badge } from '@/components 2/ui/badge';
import { Button } from '@/components 2/ui/button';
import { EnhancedLinkGeneratorForm } from '@/components/forms/enhanced-link-generator-form';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';

export default function LinksPage() {
  const [generatedLinks, setGeneratedLinks] = useState<Array<{ url: string; token: string; createdAt: string }>>([]);

  // TODO: Replace with real data from API
  const existingLinks = [
    {
      id: '1',
      client_id: 'client-1',
      clientName: 'Acme Corp',
      token: 'abc12345',
      url: 'https://app.example.com/onboarding/abc12345',
      expires_at: '2024-01-28',
      is_used: false,
      created_at: '2024-01-21',
    },
    {
      id: '2',
      client_id: 'client-2',
      clientName: 'TechStart Inc',
      token: 'def67890',
      url: 'https://app.example.com/onboarding/def67890',
      expires_at: '2024-01-25',
      is_used: true,
      created_at: '2024-01-18',
    },
  ];

  const handleLinkGenerated = (link: { url: string; token: string; platforms: string[]; permissions: Record<string, string[]> }) => {
    const newLink = {
      url: link.url,
      token: link.token,
      platforms: link.platforms,
      permissions: link.permissions,
      createdAt: new Date().toISOString(),
    };
    setGeneratedLinks(prev => [newLink, ...prev]);
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

  const allLinks = [...generatedLinks.map(link => ({
    id: link.token,
    client_id: 'new',
    clientName: 'New Client',
    token: link.token.substring(0, 8),
    url: link.url,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_used: false,
    created_at: link.createdAt.split('T')[0],
  })), ...existingLinks];

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
            <CardTitle>Generated Links</CardTitle>
            <CardDescription>
              All generated onboarding links and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{link.clientName}</h3>
                        <p className="text-sm text-gray-500">Token: {link.token}</p>
                        <p className="text-xs text-gray-400">Created: {link.created_at}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusVariant(link.is_used, link.expires_at)}>
                      {getStatusText(link.is_used, link.expires_at)}
                    </Badge>
                    <div className="text-right text-sm text-gray-500">
                      <p>Expires: {link.expires_at}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(link.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}