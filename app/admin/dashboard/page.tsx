'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard de Prompts</h1>
                <button onClick={handleLogout} className="btn btn-outline">Sair</button>
            </div>
            
            <p className="mb-6 text-gray-600">
                Bem-vindo ao painel de administração. Aqui você pode gerenciar e analisar as conversas para melhorar a base de conhecimento da Silv.IA.
            </p>

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
                {error && <p className="form-message mt-4">{error}</p>}
            </div>
        </div>
    </div>
  );
}