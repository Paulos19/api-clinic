'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressButton } from './ProgressButton'; // Importando o botão com progresso

export function ExportManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // O cookie de autenticação é enviado automaticamente pelo navegador
      const response = await fetch('/api/conversations');

      if (!response.ok) {
        const data = await response.json();
        // Se o token for inválido ou expirado, redireciona para o login
        if (response.status === 401 || response.status === 403) {
            router.push('/admin/login');
        }
        throw new Error(data.error || 'Falha ao exportar dados.');
      }

      // Lógica para iniciar o download do arquivo JSON no navegador
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exportar Histórico de Conversas</h2>
        <p className="text-sm text-muted-foreground">
            Clique no botão abaixo para baixar um arquivo JSON com todas as interações dos usuários salvas no banco de dados.
        </p>
        <ProgressButton 
            onClick={handleExport} 
            isLoading={isLoading}
            className="w-full sm:w-auto"
        >
            {isLoading ? 'Exportando...' : 'Exportar Dados'}
        </ProgressButton>
        {error && <p className="form-message mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}