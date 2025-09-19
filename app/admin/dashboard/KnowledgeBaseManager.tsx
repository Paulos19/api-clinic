'use client';

import { useState, useEffect } from 'react';

export function KnowledgeBaseManager() {
  const [basePrompt, setBasePrompt] = useState('');
  const [rawInstructions, setRawInstructions] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  // Efeito para buscar os dados iniciais do prompt no servidor
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/knowledge-base');
        if (!response.ok) throw new Error('Falha ao carregar dados do prompt.');
        const data = await response.json();
        setBasePrompt(data.basePrompt || '');
        setRawInstructions(data.rawInstructions || '');
        setKnowledgeText(data.knowledgeText || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  
  // Função para salvar as alterações como rascunho
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError('');
    try {
        const response = await fetch('/api/admin/knowledge-base', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ basePrompt, rawInstructions }),
        });
        if (!response.ok) throw new Error('Falha ao salvar rascunho.');
        alert('Rascunho salvo com sucesso!');
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar rascunho.');
    } finally {
        setIsSaving(false);
    }
  }

  // Função para usar a Gemini API para condensar e publicar o conhecimento
  const handlePublish = async () => {
    setIsPublishing(true);
    setError('');
    try {
        const response = await fetch('/api/admin/knowledge-base', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawInstructions }),
        });
        if (!response.ok) {
           const data = await response.json();
           throw new Error(data.error || 'Falha ao publicar conhecimento.');
        }
        const data = await response.json();
        setKnowledgeText(data.knowledgeText);
        alert('Base de conhecimento publicada com sucesso!');
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Erro ao publicar.');
    } finally {
        setIsPublishing(false);
    }
  }

  if (isLoading) return <p className="text-center mt-8">Carregando gerenciador de prompt...</p>;

  return (
    <div className="space-y-8 mt-10 border-t pt-8">
        <h2 className="text-xl font-semibold">Gerenciamento da Base de Conhecimento da IA</h2>
        
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>}

        <div>
            <label htmlFor="rawInstructions" className="form-label">
                Instruções para a IA (Base de Conhecimento)
            </label>
            <p className="text-sm text-gray-500 mb-2">
                Adicione aqui informações, regras e diretrizes que a Silv.IA deve saber. Ex: "Horário de almoço é das 12h às 13h.", "Não agendar consultas nas sextas à tarde.".
            </p>
            <textarea
                id="rawInstructions"
                value={rawInstructions}
                onChange={(e) => setRawInstructions(e.target.value)}
                rows={10}
                className="form-input w-full"
                placeholder="Digite as instruções aqui..."
            />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
             <button onClick={handleSaveDraft} disabled={isSaving || isPublishing} className="btn btn-secondary">
                {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
            <button onClick={handlePublish} disabled={isSaving || isPublishing} className="btn btn-primary">
                {isPublishing ? 'Publicando com IA...' : 'Gerar e Publicar Conhecimento'}
            </button>
        </div>

         <div>
            <h3 className="text-lg font-semibold">Conhecimento Publicado (Em uso pelo n8n)</h3>
            <div className="mt-2 p-4 bg-gray-50 border rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                {knowledgeText || 'Nenhuma base de conhecimento foi publicada ainda.'}
            </div>
        </div>

        <div className="border-t pt-8">
            <label htmlFor="basePrompt" className="form-label text-red-600">
                Prompt Base (PERIGO: Alterar com cuidado)
            </label>
            <p className="text-sm text-gray-500 mb-2">
               Esta é a estrutura principal do prompt. Alterações aqui podem quebrar a lógica de agendamento e outras funções.
            </p>
            <textarea
                id="basePrompt"
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                rows={15}
                className="form-input w-full font-mono text-xs"
            />
        </div>
    </div>
  );
}