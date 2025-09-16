'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { PlatformDefinition } from '@/lib/platforms/platform-definitions';

interface OAuthConnectionCardProps {
  platform: PlatformDefinition;
  isConnected: boolean;
  onConnect: (platformId: string) => void;
  isLoading?: boolean;
}

export function OAuthConnectionCard({ 
  platform, 
  isConnected, 
  onConnect, 
  isLoading = false 
}: OAuthConnectionCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      onConnect(platform.id);
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className={`${platform.color} text-white`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ExternalLink className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <CardDescription className="text-white/80">
                Connect your {platform.name} account
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="secondary" className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/50 text-white">
                Not Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2">Required Permissions:</h4>
            <div className="space-y-1">
              {platform.permissions
                .filter(perm => perm.required)
                .map((permission) => (
                  <div key={permission.id} className="text-sm text-white/90">
                    • {permission.name}
                  </div>
                ))}
            </div>
          </div>
          
          <Button
            onClick={handleConnect}
            disabled={isConnected || isConnecting || isLoading}
            variant={isConnected ? "outline" : "default"}
            className={`w-full ${
              isConnected 
                ? "bg-white/20 border-white/50 text-white hover:bg-white/30" 
                : "bg-white text-gray-900 hover:bg-white/90"
            }`}
          >
            {isConnecting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              'Reconnect'
            ) : (
              'Connect Account'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
