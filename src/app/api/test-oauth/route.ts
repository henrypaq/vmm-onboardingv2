import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Test OAuth endpoint called');
  console.log('Request URL:', request.url);
  
  return NextResponse.json({ 
    message: 'Test OAuth endpoint is working',
    url: request.url,
    timestamp: new Date().toISOString()
  });
}

