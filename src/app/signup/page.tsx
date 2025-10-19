'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.companyName) {
      newErrors.companyName = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Try API endpoint first, fallback to direct Supabase if it fails
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            companyName: formData.companyName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'API signup failed');
        }

      // Show appropriate success message based on email confirmation status
      if (data.emailConfirmationSent) {
        toast.success('Account created successfully! Please check your email for a verification code.', {
          duration: 8000,
        });
        router.push('/verify-email?email=' + encodeURIComponent(formData.email));
      } else {
        toast.success('Account created successfully! You can now sign in.', {
          duration: 5000,
        });
        router.push('/login?message=Account created successfully! You can now sign in.');
      }
        return;
      } catch (apiError) {
        console.log('API signup failed, trying direct Supabase:', apiError);
        
        // Fallback to direct Supabase client-side signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              company_name: formData.companyName,
              role: 'admin'
            }
          }
        });

        if (authError) {
          throw authError;
        }

        if (authData.user) {
          // Try to create user profile in users table
          try {
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: formData.email,
                full_name: formData.fullName,
                company_name: formData.companyName,
                role: 'admin'
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Continue anyway - the auth user is created
            }
          } catch (profileError) {
            console.error('Profile creation failed:', profileError);
            // Continue anyway - the auth user is created
          }

          // Check if email confirmation is required
          const needsConfirmation = authData.user.email_confirmed_at === null;
          
          if (needsConfirmation) {
            toast.success('Account created successfully! Please check your email for a verification code.', {
              duration: 8000,
            });
            router.push('/verify-email?email=' + encodeURIComponent(formData.email));
          } else {
            toast.success('Account created successfully! You can now sign in.', {
              duration: 5000,
            });
            router.push('/login?message=Account created successfully! You can now sign in.');
          }
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setErrors({
        general: error.message || 'An error occurred during sign up. Please try again.'
      });
      toast.error(error.message || 'An error occurred during sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AuthLayout 
      title="Create Admin Account" 
      subtitle="Join Vast to start managing your client onboarding"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-red-300 focus:border-red-500' : ''}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className={errors.companyName ? 'border-red-300 focus:border-red-500' : ''}
              placeholder="Acme Corp"
            />
            {errors.companyName && (
              <p className="text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-red-300 focus:border-red-500' : ''}
            placeholder="john@acme.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={errors.password ? 'border-red-300 focus:border-red-500 pr-10' : 'pr-10'}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'border-red-300 focus:border-red-500 pr-10' : 'pr-10'}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary h-11"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" text="Creating Account..." />
          ) : (
            'Create Admin Account'
          )}
        </Button>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
