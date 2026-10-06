import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('rh_token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas públicas liberadas
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    // Se o usuário já tiver logado e tentar abrir /login, manda pro painel
    if (token && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/colaboradores', request.url));
    }
    return NextResponse.next();
  }

  // Se não houver token nos cookies, redireciona direto pro login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};