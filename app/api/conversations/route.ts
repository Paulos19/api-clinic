import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const ADM_KEY = process.env.ADM_KEY || 'seu-segredo-super-secreto';
const N8N_API_KEY = process.env.N8N_API_KEY; // Nova chave de API

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// Handler para o método POST (receber dados do n8n)
export async function POST(request: Request) {
  try {
    // 1. Validar a chave de API do n8n
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${N8N_API_KEY}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 2. Processar o corpo da requisição (lógica existente)
    const body = await request.json();
    const { sessionId, history } = body;

    if (!sessionId || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const lastTwoMessages: HistoryItem[] = history.slice(-2);

    for (const message of lastTwoMessages) {
      if (message.content) {
        await prisma.conversation.create({
          data: {
            sessionId: sessionId,
            role: message.role,
            content: message.content,
          },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: 'Falha ao salvar conversa.', details: errorMessage }, { status: 500 });
  }
}

// Handler para o método GET (exportar dados para o admin)
// (Este método não precisa de alterações, ele continuará funcionando com o cookie do admin)
export async function GET(request: Request) {
  try {
    const tokenCookie = (await cookies()).get('admin-token');

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Não autorizado: token não fornecido.' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(ADM_KEY);
    await jwtVerify(tokenCookie.value, secret);

    const allConversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'asc' },
    });

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