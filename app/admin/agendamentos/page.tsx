import AppointmentScheduler from "../_components/AppointmentScheduler";

export default function SchedulerPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agendamento Manual</h1>
                <p className="text-sm text-muted-foreground">
                    Use a ferramenta abaixo para visualizar horários e criar agendamentos para pacientes.
                </p>
            </div>
            
            {/* O componente de agendamento é renderizado aqui, dentro do layout de admin */}
            <AppointmentScheduler />
        </div>
    );
}