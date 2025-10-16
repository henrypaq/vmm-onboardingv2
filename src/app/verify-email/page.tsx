'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

function EmailVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const email = searchParams.get('email') || '';

  const validateCode = () => {
    const newErrors: Record<string, string> = {};
    
    if (!verificationCode) {
      newErrors.code = 'Verification code is required';
    } else if (verificationCode.length < 6) {
      newErrors.code = 'Verification code must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCode()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Verify the email with the code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create user profile in users table
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: email,
              full_name: data.user.user_metadata?.full_name || '',
              company_name: data.user.user_metadata?.company_name || '',
              role: 'admin'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - the auth user is verified
          }
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          // Continue anyway - the auth user is verified
        }

        toast.success('Email verified successfully! Welcome to Vast!', {
          duration: 5000,
        });

        // Redirect to admin dashboard
        router.push('/admin');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setErrors({
        general: error.message || 'Invalid verification code. Please try again.'
      });
      toast.error(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        throw error;
      }

      toast.success('Verification code sent! Please check your email.', {
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setVerificationCode(value);
    // Clear error when user starts typing
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }
  };

  return (
    <AuthLayout 
      title="Verify Your Email" 
      subtitle="Enter the verification code sent to your email"
    >
      <div className="space-y-6">
        {/* Email Display */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Code sent to:</span>
          </div>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => handleInputChange(e.target.value)}
              className={errors.code ? 'border-red-300 focus:border-red-500' : ''}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" text="Verifying..." />
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Email
              </>
            )}
          </Button>
        </form>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Didn't receive the code?
          </p>
          <Button
            variant="outline"
            onClick={handleResendCode}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <LoadingSpinner size="sm" text="Sending..." />
            ) : (
              'Resend Verification Code'
            )}
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link 
            href="/login" 
            className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Verify Your Email" subtitle="Enter the verification code sent to your email">
        <LoadingSpinner text="Loading..." />
      </AuthLayout>
    }>
      <EmailVerificationForm />
    </Suspense>
  );
}
