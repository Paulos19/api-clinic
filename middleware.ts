import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADM_KEY = process.env.ADM_KEY || 'seu-segredo-super-secreto';

export async function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('admin-token');

  if (!tokenCookie) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(ADM_KEY);
    await jwtVerify(tokenCookie.value, secret);
    return NextResponse.next();
  } catch (err) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('admin-token');
    return response;
  }
}

// CORREÇÃO: O matcher agora protege APENAS as páginas do dashboard.
// Ele não vai mais interferir com nenhuma rota de /api.
export const config = {
  matcher: [
    '/admin/dashboard/:path*'
  ],
};