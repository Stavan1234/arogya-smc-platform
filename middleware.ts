import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  // Public paths – no auth needed
  const publicPaths = ['/', '/api/public', '/api/auth/login'];
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Protected paths – require valid token
  if (path.startsWith('/api/asha') || path.startsWith('/api/hospital') || 
      path.startsWith('/api/dashboard') || path.startsWith('/dashboard') || 
      path.startsWith('/hospital')) {
    
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      verify(token, JWT_SECRET);
      // Optionally check role-based access here
      // e.g., if path.startsWith('/dashboard') and decoded.role !== 'admin' -> deny
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/hospital/:path*'],
};
