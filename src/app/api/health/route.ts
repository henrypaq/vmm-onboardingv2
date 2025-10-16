import { NextRequest, NextResponse } from 'next/server';
import { handleApiRoute, createSuccessResponse } from '@/lib/api/api-utils';

export async function GET(request: NextRequest) {
  return handleApiRoute('Health Check', async () => {
    return {
      status: 'healthy',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      url: request.url,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    };
  });
}

