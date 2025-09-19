import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const ADM_KEY = process.env.ADM_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Função helper para verificar a autenticação do admin
async function verifyAuth() {
  if (!ADM_KEY) {
    throw new Error('ADM_KEY não está configurada no servidor.');
  }
  const tokenCookie = (await cookies()).get('admin-token');
  if (!tokenCookie) {
    throw new Error('Não autorizado: token não fornecido.');
  }
  const secret = new TextEncoder().encode(ADM_KEY);
  await jwtVerify(tokenCookie.value, secret);
}

// Função para lidar com erros de forma padronizada
function handleError(error: unknown): NextResponse {
    console.error('[API_ERROR]', error); // Log do erro no servidor para depuração
    const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    let status = 500;
    if (message.includes("Não autorizado") || message.includes("JWT")) {
        status = 403;
    }
    return NextResponse.json({ error: message }, { status });
}

// GET: Busca os dados atuais para exibir no dashboard
export async function GET() {
  try {
    await verifyAuth();
    // Busca apenas os campos que o admin pode editar ou visualizar
    const kb = await prisma.knowledgeBase.findUnique({ 
        where: { id: 1 },
        select: { rawInstructions: true, knowledgeText: true }
    });
    return NextResponse.json(kb || {});
  } catch (error) {
    return handleError(error);
  }
}

// POST: Salva as instruções brutas como rascunho
export async function POST(request: Request) {
  try {
    await verifyAuth();
    const { rawInstructions } = await request.json();

    const updatedKb = await prisma.knowledgeBase.upsert({
      where: { id: 1 },
      update: { rawInstructions },
      create: { id: 1, rawInstructions, knowledgeText: '' }, // Garante que outros campos não sejam nulos
    });

    return NextResponse.json(updatedKb);
  } catch (error) {
    return handleError(error);
  }
}

// PUT: Pega as instruções brutas, condensa com a Gemini e publica
export async function PUT(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Chave da API Gemini (GEMINI_API_KEY) não configurada no servidor.' }, { status: 500 });
  }

  try {
    await verifyAuth();
    const { rawInstructions } = await request.json();

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um assistente especialista em otimizar prompts para IAs de conversação.
      Sua tarefa é pegar as instruções abaixo, que foram escritas por um administrador, e condensá-las em um texto coeso, claro e bem estruturado.
      Este texto será inserido em um prompt maior, então ele deve ser direto e informativo. Organize em tópicos se necessário.
      O objetivo é que a IA de conversação (Silv.IA) use este texto como sua base de conhecimento principal.
      
      Instruções a serem condensadas:
      ---
      ${rawInstructions}
      ---
    `;

    const result = await model.generateContent(prompt);
    const condensedText = result.response.text();
    
    // Usa 'upsert' para atualizar o registro existente ou criar um novo se não existir
    const updatedKb = await prisma.knowledgeBase.upsert({
        where: { id: 1 },
        update: { 
            rawInstructions: rawInstructions || '', // Garante que o rascunho também seja salvo
            knowledgeText: condensedText 
        },
        create: { 
            id: 1, 
            knowledgeText: condensedText,
            rawInstructions: rawInstructions || '' 
        },
    });

    return NextResponse.json(updatedKb);

  } catch (error) {
    return handleError(error);
  }
}