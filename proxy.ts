import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

// Define role permissions
const rolePermissions: Record<string, string[]> = {
  'CMO': ['/dashboard/:path*', '/api/:path*'],
  'Deputy-CMO': ['/dashboard/health/:path*', '/api/health/:path*'],
  'Nagar-Swasthya': ['/dashboard/city/:path*', '/api/public/:path*'],
  'Hospital-Admin': ['/hospital/:path*', '/api/hospital/:path*'],
  'ASHA': ['/asha/:path*', '/api/asha/:path*'],
};

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  // Public paths
  const publicPaths = ['/', '/api/auth/login', '/api/public', '/rti'];
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Check if the role is allowed to access this path
    const allowed = Object.entries(rolePermissions).some(([r, patterns]) => {
      if (r !== role) return false;
      return patterns.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(':path*', '.*') + '$');
        return regex.test(path);
      });
    });

    if (!allowed) {
      // Redirect to appropriate dashboard based on role
      const redirectMap: Record<string, string> = {
        'CMO': '/dashboard',
        'Deputy-CMO': '/dashboard/health',
        'Nagar-Swasthya': '/dashboard/city',
        'Hospital-Admin': '/hospital',
        'ASHA': '/asha',
      };
      return NextResponse.redirect(new URL(redirectMap[role] || '/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/hospital/:path*', '/asha/:path*'],
};