import { NextResponse } from 'next/server';
import { getHealthInsurances } from '@/lib/crmApi';

let cachedInsurances: any[] = [];
let lastFetchTime: number = 0;

export async function GET() {
  const cacheDuration = 1000 * 60 * 60; // Cache de 1 hora

  if (cachedInsurances.length > 0 && (Date.now() - lastFetchTime < cacheDuration)) {
    return NextResponse.json(cachedInsurances);
  }

  try {
    const insurances = await getHealthInsurances();
    cachedInsurances = insurances;
    lastFetchTime = Date.now();
    return NextResponse.json(insurances);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: 'Falha ao buscar convênios.', details: errorMessage }, { status: 502 });
  }
}