import axios from 'axios';
import { format } from 'date-fns';

// --- INTERFACES ---
interface CrmToken {
  accessToken: string;
  expiresAt: number;
}

export interface BookingPayload {
  patient_id: number;
  healthInsuranceCode: number;
  consultationType: number;
  appointmentType: number;
  obs?: string;
}

// --- LÓGICA ---
let cachedToken: CrmToken | null = null;

// Função para normalizar strings (remover acentos, etc.)
const normalizeString = (str: string) => {
  if (!str) return '';
  return str
    .normalize("NFD") // Separa os acentos dos caracteres
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .toLowerCase()
    .trim();
};


async function getNewAccessToken(): Promise<string> {
  const tokenUrl = `${process.env.LEGACY_URL}/oauth/v1/token`;
  const clientId = process.env.LEGACY_CLIENT_ID;
  const clientSecret = process.env.LEGACY_CLIENT_SECRET;

  if (!process.env.LEGACY_URL || !clientId || !clientSecret) {
    throw new Error("Variáveis de ambiente do CRM não configuradas.");
  }
  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  try {
    const response = await axios.post(tokenUrl, {}, {
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
    });
    const { access_token, expires_in } = response.data;
    const expiresAt = Date.now() + (expires_in - 60) * 1000;
    cachedToken = { accessToken: access_token, expiresAt };
    return access_token;
  } catch (error) {
    console.error("Erro ao obter o token de acesso:", error.response?.data || error.message);
    throw new Error("Falha na autenticação com o CRM.");
  }
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }
  return getNewAccessToken();
}

export async function getHealthInsurances() {
  const token = await getAccessToken();
  const insurancesUrl = `${process.env.LEGACY_URL}/api/v1/integration/insurance-providers`;

  try {
    const response = await axios.get(insurancesUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const items = response.data.result?.items || [];
    return items
      .filter((item: { status: boolean; }) => item.status === true)
      .sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Erro ao buscar a lista de convênios:", error.response?.data || error.message);
    throw new Error("Não foi possível carregar a lista de convênios.");
  }
}

/**
 * CORREÇÃO FINAL: Comparação de nome e data ainda mais robusta.
 */
export async function findPatientId(patientName: string, patientBirthDate: string): Promise<number | null> {
    const token = await getAccessToken();
    const bookingsUrl = `${process.env.LEGACY_URL}/api/v1/integration/facilities/1/doctors/10073/addresses/1/bookings`;
    const startDate = "2020-01-01";
    const endDate = format(new Date(), "yyyy-MM-dd");

    try {
        const response = await axios.get(bookingsUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { start_date: startDate, end_date: endDate },
        });

        const bookings = response.data.result?.items || [];
        
        // --- INÍCIO DA CORREÇÃO ---
        const normalizedPatientName = normalizeString(patientName);
        // --- FIM DA CORREÇÃO ---

        const foundBooking = bookings.find((booking: { client: any; patient: { name: any; }; birthday: string | number | Date; }) => {
            const patientFullName = booking.client || booking.patient?.name;
            
            // --- INÍCIO DA CORREÇÃO ---
            const normalizedCrmName = normalizeString(patientFullName);
            // --- FIM DA CORREÇÃO ---

            let bookingBirthDateFormatted = null;
            if (booking.birthday) {
                const bookingDateObj = new Date(booking.birthday);
                if (!isNaN(bookingDateObj.getTime())) {
                    const year = bookingDateObj.getUTCFullYear();
                    const month = String(bookingDateObj.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(bookingDateObj.getUTCDate()).padStart(2, '0');
                    bookingBirthDateFormatted = `${year}-${month}-${day}`;
                }
            }

            return (
                normalizedCrmName === normalizedPatientName &&
                bookingBirthDateFormatted === patientBirthDate
            );
        });

        if (foundBooking) {
            const patientId = foundBooking.patient_id || foundBooking.record;
            return patientId;
        }
        return null;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Erro ao buscar agendamentos para encontrar paciente:", error.response?.data || error.message);
        } else {
            console.error("Erro ao buscar agendamentos para encontrar paciente:", error instanceof Error ? error.message : error);
        }
        throw new Error("Não foi possível validar o paciente no sistema do CRM.");
    }
}


export async function getAvailableSlots(startDate: string, endDate: string) {
    const token = await getAccessToken();
    const slotsUrl = `${process.env.LEGACY_URL}/api/v1/integration/facilities/1/doctors/10073/addresses/1/available-slots`;
    const response = await axios.get(slotsUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
}

export async function bookSlot(slot: string, payload: BookingPayload) {
    const token = await getAccessToken();
    const bookingUrl = `${process.env.LEGACY_URL}/api/v1/integration/facilities/1/doctors/10073/addresses/1/slots/${slot}`;
    const response = await axios.post(bookingUrl, payload, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
}