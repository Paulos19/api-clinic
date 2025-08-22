"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Estilo base necessário para o DayPicker
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon, AlertCircle, CalendarX, Loader2, X } from "lucide-react";

// --- Tipos, Schemas e Dados de Exemplo ---
interface Insurance {
  id: number;
  name: string;
}
type Slot = string;

const bookingFormSchema = z.object({
  patientName: z.string().min(3, "Nome completo é obrigatório."),
  patientBirthDate: z.string().min(10, "Data de nascimento é obrigatória.").regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD."),
  insuranceName: z.string().min(1, "O nome do convênio é obrigatório."),
  consultationType: z.coerce.number().min(1, "Selecione o tipo de consulta."),
  appointmentType: z.coerce.number().min(0, "Selecione o tipo de agendamento."),
  obs: z.string().optional(),
});
type BookingFormValues = z.infer<typeof bookingFormSchema>;

const consultationTypes = [
  { tbCodigo: 3, description: "CONSULTA" },
  { tbCodigo: 4, description: "RETORNO" },
  { tbCodigo: 20, description: "PRIMEIRA CONSULTA" },
  { tbCodigo: 17, description: "AUDIOMETRIA" },
];

const appointmentTypes = [
  { value: 0, label: "1ª Consulta" },
  { value: 1, label: "Consulta" },
  { value: 2, label: "Exame" },
  { value: 3, label: "Retorno" },
];

const formatDateForAPI = (date: Date): string => format(date, "yyyy-MM-dd");

// --- Componente Principal ---
export default function AppointmentScheduler() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [isLoadingInsurances, setIsLoadingInsurances] = useState(true);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'validating' | 'booking'>('idle');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const form = useForm<BookingFormValues>({
  resolver: zodResolver(bookingFormSchema) as Resolver<BookingFormValues>,
  defaultValues: { obs: "" },
});

  // Efeito para buscar a lista de convênios
  useEffect(() => {
    async function fetchInsurances() {
      setIsLoadingInsurances(true);
      try {
        const response = await fetch('/api/insurances');
        if (!response.ok) throw new Error("Não foi possível carregar os convênios.");
        setInsurances(await response.json());
      } catch (error) {
        console.error(error);
        setToast({ type: 'error', message: "Erro ao carregar lista de convênios." });
      } finally {
        setIsLoadingInsurances(false);
      }
    }
    fetchInsurances();
  }, []);

  // Efeito para buscar horários disponíveis
  useEffect(() => {
    if (!date) { setIsLoading(false); setSlots([]); return; }
    const fetchSlots = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const formattedDate = formatDateForAPI(date);
        const response = await fetch(`/api/available-slots?start_date=${formattedDate}&end_date=${formattedDate}`);
        if (!response.ok) throw new Error("Falha ao carregar horários.");
        setSlots(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, [date]);

  // Efeito para fechar o popover do calendário
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efeito para o toast desaparecer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Função de submissão do formulário
  const onSubmit = async (values: BookingFormValues) => {
    if (!selectedSlot) return;

    const insuranceNameUpper = values.insuranceName.toUpperCase();
    const selectedInsurance = insurances.find(ins => ins.name.toUpperCase() === insuranceNameUpper);

    if (!selectedInsurance) {
      form.setError("insuranceName", { type: "manual", message: "Convênio inválido. Selecione um da lista." });
      return;
    }

    setBookingStatus('validating');
    try {
      const payload = {
        slot: selectedSlot,
        patientName: values.patientName,
        patientBirthDate: values.patientBirthDate,
        healthInsuranceCode: selectedInsurance.id,
        consultationType: values.consultationType,
        appointmentType: values.appointmentType,
        obs: values.obs,
      };

      setBookingStatus('booking');
      const response = await fetch('/api/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || "Falha ao agendar consulta.");
      }

      setToast({ type: 'success', message: `Agendado para ${format(new Date(result.result.start_at), "dd/MM/yyyy HH:mm")}` });
      setSelectedSlot(null);
      setDate(prevDate => prevDate ? new Date(prevDate.getTime()) : new Date());
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : "Tente novamente." });
    } finally {
      setBookingStatus('idle');
    }
  };

  const isSubmitting = bookingStatus !== 'idle';

  return (
    <>
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] p-4 rounded-md shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <p className="font-bold">{toast.type === 'success' ? 'Sucesso!' : 'Erro!'}</p>
          <p>{toast.message}</p>
        </div>
      )}

      <div className="bg-white text-gray-900 rounded-xl border border-gray-200 shadow-lg p-6 sm:p-8 max-w-2xl mx-auto my-8 sm:my-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agende sua Consulta</h1>
          <p className="text-gray-500 text-sm sm:text-base">Selecione uma data para ver os horários disponíveis.</p>
        </div>

        <div className="relative" ref={popoverRef}>
          <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="btn btn-outline w-full justify-start text-left font-normal text-base py-3 px-4 h-auto">
            <CalendarIcon className="mr-3 h-5 w-5" />
            {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
          </button>
          {isCalendarOpen && (
            <div className="absolute z-10 w-auto p-0 mt-2 bg-white border rounded-md shadow-lg">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  setDate(selectedDate || undefined);
                  setIsCalendarOpen(false);
                }}
                locale={ptBR}
                disabled={{ before: new Date() }}
              />
            </div>
          )}
        </div>

        <div className="border-t pt-8">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-10 w-full bg-gray-200 rounded-md" />))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
              <p className="font-bold">Erro!</p><p>{error}</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Horários para {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : '...'}:
              </h2>
              {slots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {slots.map((slot) => (
                    <button key={slot} onClick={() => { form.reset(); setSelectedSlot(slot); }} className="btn btn-outline w-full transition-transform hover:scale-105">
                      {format(new Date(slot), "HH:mm")}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-gray-50 border-2 border-dashed rounded-lg space-y-3">
                  <CalendarX className="h-10 w-10 text-gray-400" />
                  <p className="text-gray-500 font-medium">Nenhum horário disponível para esta data.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="dialog-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Confirmar Agendamento</h3>
                <p className="text-sm text-gray-500">Para {format(new Date(selectedSlot), "dd/MM/yyyy 'às' HH:mm")}</p>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div>
                <label htmlFor="patientName" className="form-label">Nome Completo do Paciente</label>
                <input id="patientName" {...form.register("patientName")} className="form-input mt-1" />
                {form.formState.errors.patientName && <p className="form-message mt-1">{form.formState.errors.patientName.message}</p>}
              </div>
              <div>
                <label htmlFor="patientBirthDate" className="form-label">Data de Nascimento</label>
                <input id="patientBirthDate" type="date" {...form.register("patientBirthDate")} className="form-input mt-1" />
                {form.formState.errors.patientBirthDate && <p className="form-message mt-1">{form.formState.errors.patientBirthDate.message}</p>}
              </div>
              <div>
                <label htmlFor="insuranceName" className="form-label">Convênio</label>
                <input
                  id="insuranceName"
                  list="insurances-list"
                  {...form.register("insuranceName")}
                  className="form-input mt-1"
                  disabled={isLoadingInsurances}
                  placeholder={isLoadingInsurances ? "Carregando..." : "Digite o nome do convênio"}
                  onChange={(e) => { e.target.value = e.target.value.toUpperCase(); form.setValue("insuranceName", e.target.value); }}
                />
                <datalist id="insurances-list">
                  {insurances.map(ins => (<option key={ins.id} value={ins.name} />))}
                </datalist>
                {form.formState.errors.insuranceName && <p className="form-message mt-1">{form.formState.errors.insuranceName.message}</p>}
              </div>
              <div>
                <label htmlFor="consultationType" className="form-label">Tipo de Consulta</label>
                <select id="consultationType" {...form.register("consultationType")} className="form-input mt-1">
                  <option value="">Selecione...</option>
                  {consultationTypes.map(t => <option key={t.tbCodigo} value={t.tbCodigo}>{t.description}</option>)}
                </select>
                {form.formState.errors.consultationType && <p className="form-message mt-1">{form.formState.errors.consultationType.message}</p>}
              </div>
              <div>
                <label htmlFor="appointmentType" className="form-label">Tipo de Agendamento</label>
                <select id="appointmentType" {...form.register("appointmentType")} className="form-input mt-1">
                  <option value="">Selecione...</option>
                  {appointmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.formState.errors.appointmentType && <p className="form-message mt-1">{form.formState.errors.appointmentType.message}</p>}
              </div>
              <div>
                <label htmlFor="obs" className="form-label">Observações (Opcional)</label>
                <input id="obs" {...form.register("obs")} className="form-input mt-1" />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-6 py-2 min-w-[150px] text-center">
                  {bookingStatus === 'idle' && 'Confirmar'}
                  {bookingStatus === 'validating' && <div className="flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Validando...</div>}
                  {bookingStatus === 'booking' && <div className="flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Agendando...</div>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}