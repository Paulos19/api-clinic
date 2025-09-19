import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const ADM_KEY = process.env.ADM_KEY || 'seu-segredo-super-secreto';

export async function POST(request: Request) {
  try {
    const { tokenInput } = await request.json();

    // Esta é uma verificação simples. Em um caso real, você poderia
    // comparar o token com o ADM_KEY de forma mais segura.
    if (tokenInput !== ADM_KEY) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    // Cria o token JWT que será armazenado no cookie
    const secret = new TextEncoder().encode(ADM_KEY);
    const alg = 'HS256';

    const jwt = await new SignJWT({ isAdmin: true })
      .setProtectedHeader({ alg })
      .setExpirationTime('24h') // Token expira em 24 horas
      .setIssuedAt()
      .sign(secret);

    // Cria a resposta e define o cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-token', jwt, {
      httpOnly: true, // O cookie não pode ser acessado por JavaScript no cliente
      secure: process.env.NODE_ENV !== 'development', // Use secure em produção (HTTPS)
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return response;

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}