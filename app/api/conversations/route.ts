import { cookies } from 'next/headers'; // Importar 'cookies'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose'; // Usar jwtVerify

const prisma = new PrismaClient();
const ADM_KEY = process.env.ADM_KEY || 'seu-segredo-super-secreto';

// ... (O método POST continua o mesmo) ...

// Handler para o método GET (exportar dados para o admin)
export async function GET(request: Request) {
  try {
    const tokenCookie = (await cookies()).get('admin-token'); // Ler o cookie

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Não autorizado: token não fornecido.' }, { status: 401 });
    }

    // Verifica o token JWT
    const secret = new TextEncoder().encode(ADM_KEY);
    await jwtVerify(tokenCookie.value, secret);

    const allConversations = await prisma.conversation.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Estrutura o JSON para exportação
    const groupedBySession = allConversations.reduce((acc, msg) => {
      acc[msg.sessionId] = acc[msg.sessionId] || [];
      acc[msg.sessionId].push({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      });
      return acc;
    }, {} as Record<string, any[]>);


    return new Response(JSON.stringify(groupedBySession, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="conversations-export-${new Date().toISOString()}.json"`,
      },
    });

  } catch (error) {
     if (error instanceof Error && error.name.includes('JWT')) {
      return NextResponse.json({ error: 'Não autorizado: token inválido ou expirado.' }, { status: 403 });
    }
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: 'Falha ao exportar conversas.', details: errorMessage }, { status: 500 });
  }
}