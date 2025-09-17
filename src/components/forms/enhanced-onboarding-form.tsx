'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientOAuthButton } from '@/components/oauth/client-oauth-button';
import { getAllPlatforms } from '@/lib/platforms/platform-definitions';
// Removed direct database import - using API route instead

interface OnboardingFormProps {
  token: string;
  onSubmissionComplete: (requestId: string) => void;
}

export function EnhancedOnboardingForm({ token, onSubmissionComplete }: OnboardingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const platforms = getAllPlatforms();

  // Load existing onboarding request data
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const response = await fetch(`/api/onboarding/request?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          if (data.request) {
            setFormData({
              name: data.request.client_name || '',
              email: data.request.client_email || '',
              company: data.request.company_name || '',
            });
            setSelectedPermissions(Object.values(data.request.granted_permissions || {}).flat() as string[]);
            setConnectedPlatforms(Object.keys(data.request.platform_connections || {}));
          }
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingData();
  }, [token]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handlePlatformConnect = (platformId: string) => {
    // Redirect to OAuth flow
    window.location.href = `/api/oauth/client/connect/${platformId}?token=${token}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          permissions: selectedPermissions,
          data: {
            ...formData,
            submittedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit onboarding request');
      }

      const data = await response.json();
      onSubmissionComplete(data.requestId);
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Please provide your contact information for this onboarding request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Enter your company name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Connections</CardTitle>
          <CardDescription>
            Connect your accounts to grant the requested permissions. You can connect multiple platforms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((platform) => (
            <ClientOAuthButton
              key={platform.id}
              platform={platform}
              isConnected={connectedPlatforms.includes(platform.id)}
              token={token}
              onConnect={handlePlatformConnect}
            />
          ))}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Requested Permissions</CardTitle>
          <CardDescription>
            Select the permissions you would like to request for your integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platforms.map((platform) => (
              <div key={platform.id} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{platform.name}</h4>
                  {connectedPlatforms.includes(platform.id) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {platform.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`${platform.id}-${permission.id}`}
                        checked={selectedPermissions.includes(`${platform.id}:${permission.id}`)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(`${platform.id}:${permission.id}`, checked as boolean)
                        }
                        disabled={!connectedPlatforms.includes(platform.id)}
                      />
                      <div className="space-y-1">
                        <Label 
                          htmlFor={`${platform.id}-${permission.id}`}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            !connectedPlatforms.includes(platform.id) ? 'text-gray-400' : ''
                          }`}
                        >
                          {permission.name}
                          {permission.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <p className={`text-sm ${
                          !connectedPlatforms.includes(platform.id) ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPermissions.length === 0 || !formData.name || !formData.email}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Submitting Request...' : 'Submit Onboarding Request'}
          </Button>
          <p className="text-sm text-gray-500 text-center mt-2">
            By submitting, you agree to grant the selected permissions to the requesting organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
