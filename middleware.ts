import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADM_KEY = process.env.ADM_KEY || 'seu-segredo-super-secreto';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('admin-token');

  // Se o usuário está tentando acessar a página de login, deixe-o passar
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Se não há token e o usuário tenta acessar uma rota protegida de admin
  if (!tokenCookie) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Se há um token, valide-o
  try {
    const secret = new TextEncoder().encode(ADM_KEY);
    await jwtVerify(tokenCookie.value, secret);
    // Token é válido, permite o acesso
    return NextResponse.next();
  } catch (err) {
    // Token é inválido, redireciona para o login
    console.error('Falha na verificação do JWT no middleware:', err);
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

// Configura o middleware para rodar apenas nas rotas de admin
export const config = {
  matcher: '/admin/:path*',
};