import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('crm_token')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  
  // Define protected routes
  const isProtectedRoute = 
    pathname.startsWith('/client') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/welcome') ||
    pathname === '/'; // Root usually redirects somewhere or needs auth

  if (isPublicRoute && token) {
    // If user has token and tries to access login/register, redirect to a safe default page
    // We don't have the user role here synchronously, so we redirect to /client.
    // Client page will redirect to /admin or /welcome if their role doesn't match MENTOR/TEACHER.
    return NextResponse.redirect(new URL('/client', request.url));
  }

  if (isProtectedRoute && !token) {
    // If user doesn't have token and tries to access a protected route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. svg, png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
