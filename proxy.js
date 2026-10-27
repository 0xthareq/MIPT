import { NextResponse } from 'next/server';
import { COOKIE, verifyToken } from './lib/token';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await verifyToken(request.cookies.get(COOKIE)?.value);

  if (pathname === '/login') {
    if (session && request.method === 'GET') return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }
  if (!session) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|icon.svg).*)'],
};
