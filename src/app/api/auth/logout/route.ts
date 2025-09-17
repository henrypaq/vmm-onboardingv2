import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth/auth';

export async function POST() {
  try {
    await signOut();
    
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
