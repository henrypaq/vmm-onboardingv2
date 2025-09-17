import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Health check endpoint called');
  console.log('Request URL:', request.url);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  
  return NextResponse.json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    url: request.url,
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });
}
