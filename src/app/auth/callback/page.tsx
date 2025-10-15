'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LoadingDialog } from '@/components/ui/loading-spinner';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try signing in again.');
          toast.error('Authentication failed. Please try signing in again.');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');
          toast.success('Email verified successfully!');
          
          // Redirect to admin dashboard after a short delay
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No active session found. Please sign in again.');
          toast.error('No active session found. Please sign in again.');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred. Please try again.');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <LoadingDialog 
                title="Verifying your email..." 
                description="Please wait while we confirm your account."
              />
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  Email Verified!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {message}
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  Verification Failed
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {message}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingDialog title="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
