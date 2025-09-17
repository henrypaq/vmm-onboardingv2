'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { EnhancedOnboardingForm } from '@/components/forms/enhanced-onboarding-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface LinkValidation {
  valid: boolean;
  clientId?: string;
  expiresAt?: string;
  error?: string;
}

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [linkValidation, setLinkValidation] = useState<LinkValidation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const validateLink = useCallback(async () => {
    try {
      const response = await fetch(`/api/links/validate?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setLinkValidation({ valid: true, ...data });
      } else {
        setLinkValidation({ valid: false, error: data.error });
      }
    } catch (error) {
      console.error('Link validation error:', error);
      setLinkValidation({ valid: false, error: 'Failed to validate link' });
    } finally {
      setIsValidating(false);
    }
  }, [token]);

  useEffect(() => {
    validateLink();
  }, [token, validateLink]);

  const handleSubmissionComplete = (newRequestId: string) => {
    setRequestId(newRequestId);
    setIsSubmitted(true);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating your onboarding link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              {linkValidation?.error || 'This onboarding link is not valid or has expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">Request Submitted!</CardTitle>
            <CardDescription>
              Your onboarding request has been submitted successfully.
              {requestId && (
                <span className="block mt-2 text-sm font-mono bg-gray-100 p-2 rounded">
                  Request ID: {requestId}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              You will receive an email notification once your request has been reviewed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Onboarding
          </h1>
          <p className="text-gray-600">
            Please complete the form below to request access to our platform.
          </p>
        </div>
        
        <EnhancedOnboardingForm 
          token={token}
          onSubmissionComplete={handleSubmissionComplete}
        />
      </div>
    </div>
  );
}
