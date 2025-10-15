'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Globe } from 'lucide-react';
import { PlatformDefinition } from '@/lib/platforms/platform-definitions';

interface ClientOAuthButtonProps {
  platform: PlatformDefinition;
  isConnected: boolean;
  token: string;
  onConnect: (platformId: string, token: string) => void;
  isLoading?: boolean;
}

export function ClientOAuthButton({ 
  platform, 
  isConnected, 
  token,
  onConnect, 
  isLoading = false 
}: ClientOAuthButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      onConnect(platform.id, token);
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
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
          width={40} 
          height={40}
          className="object-contain"
        />
      );
    }
    
    return <Globe className="h-10 w-10" />;
  };

  return (
    <div className={`${platform.color} text-white rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2">
            {getPlatformLogo(platform.id)}
          </div>
          <div>
            <h3 className="font-medium text-lg">{platform.name}</h3>
            <p className="text-white/80 text-sm">
              Connect your {platform.name} account to grant permissions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Badge variant="secondary" className="bg-green-500 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isLoading}
              variant="default"
              className="bg-white text-gray-900 hover:bg-white/90"
            >
              {isConnecting || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


