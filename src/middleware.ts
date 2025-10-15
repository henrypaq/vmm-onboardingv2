import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = await createClient();
    
    // Get the session from the request
    const { data: { session } } = await supabase.auth.getSession();
    
    // Define protected routes
    const protectedRoutes = ['/admin', '/admin/clients', '/admin/links', '/admin/settings'];
    const authRoutes = ['/login', '/signup', '/forgot-password'];
    
    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    
    // If user is not authenticated and trying to access protected route
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // If user is authenticated and trying to access auth pages, redirect to admin
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    // If user is authenticated and on home page, redirect to admin
    if (pathname === '/' && session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an error, allow the request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
