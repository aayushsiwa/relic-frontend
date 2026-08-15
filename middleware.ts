import { NextRequest, NextResponse } from 'next/server';

import { config as appConfig } from '@/lib/config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    appConfig.app.mode === 'landing' &&
    pathname !== '/landing' &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
