import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // Garante que a rota não use cache

// Handler para o método GET (usado pelo n8n)
export async function GET() {
  try {
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: 1 },
      select: { knowledgeText: true },
    });

    // Retorna o texto do conhecimento ou uma string vazia se não houver nada
    return NextResponse.json({ knowledgeText: kb?.knowledgeText || '' });

  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao buscar a base de conhecimento.' },
      { status: 500 }
    );
  }
}