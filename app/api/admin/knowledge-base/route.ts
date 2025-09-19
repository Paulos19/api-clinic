import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const ADM_KEY = process.env.ADM_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ... (Funções verifyAuth e handleError continuam as mesmas) ...
async function verifyAuth() {
  if (!ADM_KEY) throw new Error('ADM_KEY não está configurada no servidor.');
  const tokenCookie = (await cookies()).get('admin-token');
  if (!tokenCookie) throw new Error('Não autorizado: token não fornecido.');
  const secret = new TextEncoder().encode(ADM_KEY);
  await jwtVerify(tokenCookie.value, secret);
}

function handleError(error: unknown): NextResponse {
    console.error('[API_ERROR]', error);
    const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    let status = 500;
    if (message.includes("Não autorizado") || message.includes("JWT")) status = 403;
    return NextResponse.json({ error: message }, { status });
}

// GET: Busca a base de conhecimento e todos os seus campos associados
export async function GET() {
  try {
    await verifyAuth();
    const kb = await prisma.knowledgeBase.findUnique({ 
        where: { id: 1 },
        include: { fields: { orderBy: { createdAt: 'asc' } } } // Inclui os campos relacionados
    });
    // Se não existir, cria o registro base
    if (!kb) {
        const newKb = await prisma.knowledgeBase.create({
            data: { id: 1, updateCount: 0, knowledgeText: '' }
        });
        return NextResponse.json({ ...newKb, fields: [] });
    }
    return NextResponse.json(kb);
  } catch (error) {
    return handleError(error);
  }
}

// POST: Sincroniza (cria, atualiza, deleta) os campos de conhecimento
export async function POST(request: Request) {
  try {
    await verifyAuth();
    const fields: { id?: string; title: string; content: string }[] = await request.json();

    const transaction = await prisma.$transaction(async (tx) => {
        // IDs dos campos enviados pelo frontend
        const incomingIds = fields.map(f => f.id).filter(Boolean) as string[];

        // Deleta campos que não vieram na requisição
        await tx.knowledgeField.deleteMany({
            where: {
                knowledgeBaseId: 1,
                id: { notIn: incomingIds }
            }
        });

        // Atualiza ou cria os campos
        for (const field of fields) {
            if (field.id) { // Atualiza campo existente
                await tx.knowledgeField.update({
                    where: { id: field.id },
                    data: { title: field.title, content: field.content }
                });
            } else { // Cria novo campo
                await tx.knowledgeField.create({
                    data: {
                        title: field.title,
                        content: field.content,
                        knowledgeBaseId: 1
                    }
                });
            }
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

// PUT: Pega TODOS os campos do DB, condensa e publica
export async function PUT(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Chave da API Gemini não configurada.' }, { status: 500 });
  }

  try {
    await verifyAuth();
    
    // Busca todos os campos de conhecimento do banco de dados
    const allFields = await prisma.knowledgeField.findMany({
        where: { knowledgeBaseId: 1 },
        orderBy: { createdAt: 'asc' }
    });

    if (allFields.length === 0) {
        throw new Error("Nenhum campo de conhecimento para publicar. Salve um rascunho primeiro.");
    }

    // Concatena o conteúdo de todos os campos
    const combinedInstructions = allFields
        .map(field => `Tópico: ${field.title}\nConteúdo: ${field.content}`)
        .join('\n\n---\n\n');

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um especialista em otimizar prompts. Sua tarefa é pegar os tópicos e conteúdos abaixo e condensá-los em um texto coeso, claro e bem estruturado para ser a base de conhecimento de uma IA de conversação.
      
      Instruções a serem condensadas:
      ---
      ${combinedInstructions}
      ---
    `;

    const result = await model.generateContent(prompt);
    const condensedText = result.response.text();
    
    const updatedKb = await prisma.knowledgeBase.update({
        where: { id: 1 },
        data: { 
            knowledgeText: condensedText,
            updateCount: { increment: 1 }
        },
    });

    return NextResponse.json(updatedKb);

  } catch (error) {
    return handleError(error);
  }
}