import { NextResponse } from 'next/server';
import { findPatientData, bookSlot } from '@/lib/crmApi'; // Importar findPatientData

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slot,
      patientName,
      patientBirthDate,
      // healthInsuranceCode não é mais recebido, será buscado
      consultationType,
      appointmentType,
      obs
    } = body;

    // A validação não precisa mais do healthInsuranceCode
    if (!slot || !patientName || !patientBirthDate || !consultationType) {
      return NextResponse.json({ error: "Dados insuficientes para o agendamento." }, { status: 400 });
    }

    // Busca os dados do paciente, incluindo o convênio
    const patientData = await findPatientData(patientName, patientBirthDate);

    if (!patientData) {
      return NextResponse.json({ error: "Paciente não encontrado. Verifique o nome e a data de nascimento." }, { status: 404 });
    }

    // Monta o payload com o healthInsuranceCode obtido da busca
    const bookingPayload = {
      patient_id: patientData.patientId,
      healthInsuranceCode: patientData.healthInsuranceId, // Usando o valor retornado
      consultationType,
      appointmentType,
      obs
    };

    const bookingResult = await bookSlot(slot, bookingPayload);

    return NextResponse.json(bookingResult);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Um erro inesperado ocorreu.";
    return NextResponse.json({ error: 'Falha ao processar o agendamento.', details: errorMessage }, { status: 502 });
  }
}