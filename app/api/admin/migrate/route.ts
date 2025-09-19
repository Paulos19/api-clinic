import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const N8N_API_KEY = process.env.N8N_API_KEY;

interface MigrationData {
  sessionId: string;
  message: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${N8N_API_KEY}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body: MigrationData[] = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'O corpo da requisição deve ser um array.' }, { status: 400 });
    }

    const conversationsToCreate = body.flatMap(record =>
      record.message.map(msg => ({
        sessionId: record.sessionId,
        role: msg.role,
        content: msg.content,
      }))
    );
    
    await prisma.conversation.deleteMany({});

    const result = await prisma.conversation.createMany({
      data: conversationsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: result.count });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: 'Falha ao migrar os dados.', details: errorMessage }, { status: 500 });
  }
}