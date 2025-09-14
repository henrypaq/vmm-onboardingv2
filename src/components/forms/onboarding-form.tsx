'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface OnboardingFormProps {
  token: string;
  onSubmissionComplete: (requestId: string) => void;
}

const PERMISSIONS = [
  { id: 'read_profile', label: 'Read Profile Information', description: 'Access to basic profile data' },
  { id: 'read_contacts', label: 'Read Contacts', description: 'Access to contact information' },
  { id: 'read_calendar', label: 'Read Calendar', description: 'Access to calendar events' },
  { id: 'write_contacts', label: 'Write Contacts', description: 'Create and update contacts' },
  { id: 'write_calendar', label: 'Write Calendar', description: 'Create and update calendar events' },
  { id: 'admin_access', label: 'Admin Access', description: 'Full administrative access' },
];

export function OnboardingForm({ token, onSubmissionComplete }: OnboardingFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Onboarding Request</CardTitle>
        <CardDescription>
          Please select the permissions you would like to request for your integration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Permissions</Label>
            {PERMISSIONS.map((permission) => (
              <div key={permission.id} className="flex items-start space-x-3">
                <Checkbox
                  id={permission.id}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(permission.id, checked as boolean)
                  }
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor={permission.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.label}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {permission.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedPermissions.length === 0}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
