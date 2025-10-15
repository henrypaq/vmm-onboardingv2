'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Loader2, ShieldCheck, Info, Globe } from 'lucide-react';
import { PlatformDefinition } from '@/lib/platforms/platform-definitions';

interface OAuthConnectionCardProps {
  platform: PlatformDefinition;
  isConnected: boolean;
  onConnect: (platformId: string) => void;
  isLoading?: boolean;
}

const getPlatformLogo = (platformId: string) => {
  const logoMap: { [key: string]: string } = {
    'meta': '/logos/meta.png',
    'facebook': '/logos/meta.png',
    'google': '/logos/google.png',
    'tiktok': '/logos/tiktok.webp',
    'shopify': '/logos/shopify.png',
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
        {/* Status Indicator */}
        {isConnected && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl">
              {getPlatformLogo(platform.id)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <CardDescription>
                {isConnected ? 'Account connected' : `Connect your ${platform.name} account`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <Separator />

        <CardContent className="pt-4 space-y-4">
          {/* Required Permissions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Required Permissions
            </div>
            <div className="space-y-1.5 pl-6">
              {platform.permissions
                .filter(perm => perm.required)
                .slice(0, 3)
                .map((permission) => (
                  <div key={permission.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary" />
                    <span className="flex-1">{permission.name}</span>
                  </div>
                ))}
              {platform.permissions.filter(p => p.required).length > 3 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-3">
                  <Info className="h-3 w-3" />
                  +{platform.permissions.filter(p => p.required).length - 3} more permissions
                </div>
              )}
            </div>
          </div>
          
          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={isConnected || isConnecting || isLoading}
            variant={isConnected ? "outline" : "default"}
            className="w-full"
            size="lg"
          >
            {isConnecting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Reconnect
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Connect Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}


