'use client';

import { useRouter } from 'next/navigation';
import { ExportManager } from './ExportManager';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-8">
        <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard de Prompts</h1>
                <button onClick={handleLogout} className="btn btn-outline">
                    Sair
                </button>
            </div>
            
            <p className="mb-6 text-gray-600">
                Bem-vindo ao painel de administração. Use as seções abaixo para exportar conversas e gerenciar a base de conhecimento da IA.
            </p>

            {/* Seção de Exportação de Conversas */}
            <ExportManager />

            {/* Seção de Gerenciamento de Prompt e Base de Conhecimento */}
            <KnowledgeBaseManager />
        </div>
    </div>
  );
}