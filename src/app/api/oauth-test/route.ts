import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('OAuth test endpoint called');
  console.log('Request URL:', request.url);
  console.log('Environment:', process.env.NODE_ENV);
  
  return NextResponse.json({ 
    message: 'OAuth test endpoint is working',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    url: request.url,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    metaAppId: process.env.META_APP_ID ? 'SET' : 'NOT SET',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
  });
}

