import { NextResponse } from 'next/server';
import { findPatientId, bookSlot } from '@/lib/crmApi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slot,
      patientName,
      patientBirthDate,
      healthInsuranceCode,
      consultationType,
      appointmentType,
      obs
    } = body;

    if (!slot || !patientName || !patientBirthDate || !healthInsuranceCode || !consultationType) {
      return NextResponse.json({ error: "Dados insuficientes para o agendamento." }, { status: 400 });
    }

    const patient_id = await findPatientId(patientName, patientBirthDate);

    if (!patient_id) {
      return NextResponse.json({ error: "Paciente não encontrado. Verifique o nome e a data de nascimento." }, { status: 404 });
    }

    const bookingPayload = {
      patient_id,
      healthInsuranceCode,
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