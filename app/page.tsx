import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Portal da Clínica Dr. Marco Teixeira
        </h1>
        <p className="text-lg text-muted-foreground">
          Gerenciamento de agendamentos e atendimento ao paciente.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/admin/dashboard">Acessar o Painel de Controle</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}