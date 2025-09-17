'use client';

import { useState } from 'react';
import { Button } from '@/components 2/ui/button';
import { Input } from '@/components 2/ui/input';
import { Label } from '@/components 2/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components 2/ui/card';

interface LinkGeneratorFormProps {
  onLinkGenerated: (link: { url: string; token: string }) => void;
}

export function LinkGeneratorForm({ onLinkGenerated }: LinkGeneratorFormProps) {
  const [clientId, setClientId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch('/api/links/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          expiresInDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const data = await response.json();
      onLinkGenerated({ url: data.url, token: data.link.token });
      
      // Reset form
      setClientId('');
      setExpiresInDays(7);
    } catch (error) {
      console.error('Error generating link:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Onboarding Link</CardTitle>
        <CardDescription>
          Create a unique, expiring link for client onboarding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="expiresInDays">Expires in (days)</Label>
            <Input
              id="expiresInDays"
              type="number"
              min="1"
              max="30"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
            />
          </div>
          
          <Button type="submit" disabled={isGenerating} className="w-full">
            {isGenerating ? 'Generating...' : 'Generate Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
