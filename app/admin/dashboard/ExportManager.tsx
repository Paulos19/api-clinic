'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ExportManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // O cookie é enviado automaticamente pelo navegador
      const response = await fetch('/api/conversations');

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
            router.push('/admin/login'); // Redireciona se o token for inválido
        }
        throw new Error(data.error || 'Falha ao exportar dados.');
      }

      // Inicia o download do arquivo JSON
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">Exportar Histórico de Conversas</h2>
        <p className="text-sm text-gray-500 mb-4">
            Clique no botão abaixo para baixar um arquivo JSON com todas as interações dos usuários.
        </p>
        <button 
            onClick={handleExport} 
            disabled={isLoading}
            className="btn btn-primary w-full sm:w-auto"
        >
            {isLoading ? 'Exportando...' : 'Exportar Dados'}
        </button>
        {error && <p className="form-message mt-4 text-red-600">{error}</p>}
    </div>
  );
}