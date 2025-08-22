import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/crmApi';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Parâmetros 'start_date' e 'end_date' são obrigatórios." },
      { status: 400 }
    );
  }

  try {
    const slotsData = await getAvailableSlots(startDate, endDate);
    const availableItems = slotsData.result?.items || [];
    return NextResponse.json(availableItems);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Um erro inesperado ocorreu.";
    return NextResponse.json(
      { error: 'Falha ao buscar dados do CRM.', details: errorMessage },
      { status: 502 }
    );
  }
}