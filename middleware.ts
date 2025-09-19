import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADM_KEY = process.env.ADM_KEY || 'seu-segredo-super-secreto';

export async function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('admin-token');

  // Se não há token, redireciona para a página de login
  if (!tokenCookie) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Se há um token, valide-o
  try {
    const secret = new TextEncoder().encode(ADM_KEY);
    await jwtVerify(tokenCookie.value, secret);
    return NextResponse.next();
  } catch (err) {
    // Se o token for inválido, redireciona para o login
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    // Limpa o cookie inválido
    response.cookies.delete('admin-token');
    return response;
  }
}

// Configura o middleware para rodar APENAS em rotas de PÁGINAS do admin,
// ignorando as rotas de API.
export const config = {
  matcher: '/admin/((?!login|_next/static|_next/image|favicon.ico|api/).*)',
};