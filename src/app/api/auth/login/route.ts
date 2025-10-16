import { NextRequest } from 'next/server';
import { signIn } from '@/lib/auth/auth';
import { handleApiRoute, safeJsonParse } from '@/lib/api/api-utils';

export async function POST(request: NextRequest) {
  return handleApiRoute('User Login', async () => {
    const { email, password } = await safeJsonParse<{ email: string; password: string }>(request);
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const session = await signIn(email, password);
    
    if (!session) {
      throw new Error('Invalid credentials');
    }

    return { session };
  });
}
