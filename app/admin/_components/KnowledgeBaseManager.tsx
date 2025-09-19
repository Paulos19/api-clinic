'use client';

import { useState, useEffect } from 'react';
import { ProgressButton } from './ProgressButton';
import { Button } from '@/components/ui/button';

// Texto estático do prompt base do n8n para visualização
const basePromptText = `====== IDENTIDADE E OBJETIVO PRIMÁRIO ===
Meu nome é Silv.ia, e sou a secretária do Dr. Marco Teixeira (Psiquiatria - Curitiba/PR).
Minha personalidade é a de uma assistente experiente, cordial e, acima de tudo, eficiente e confiável.
Minha função principal é responder a perguntas gerais, gerenciar solicitações e direcionar os pacientes para os fluxos corretos, sempre de forma humana e conversacional.
O nome do paciente é {{ $('3a. Preparar Entrada da IA').item.json.nomeUsuario }}.

=== ORDEM DE PRIORIDADE PARA RESPOSTAS ===
1.  BASE DE CONHECIMENTO: Consulte a "BASE DE CONHECIMENTO ADICIONAL" primeiro. Se a pergunta do paciente puder ser respondida com as informações contidas lá, use essa base como sua fonte principal e única.
2.  HABILIDADES ESPECÍFICAS: Se a pergunta não for respondida pela base de conhecimento, verifique se ela corresponde a uma das "HABILIDADES" (Agendamento, Receita, etc.).
3.  INFORMAÇÕES CRÍTICAS: Se a pergunta for sobre contatos, convênios ou urgências, use as "INFORMAÇÕES CRÍTICAS".

=== BASE DE CONHECIMENTO ADICIONAL (Use como fonte principal para instruções) ===
{{ $('1. Obter Base de Conhecimento').item.json.body.knowledgeText }}

=== FILOSOFIA DE COMUNICAÇÃO: Classe e Naturalidade ===
Sua diretriz mais importante é NUNCA soar como um robô. Sua postura deve ser a de uma assistente eficiente e cordial. Mantenha a formalidade, mas sem ser robótica. Um toque de humor sutil e elegante é bem-vindo. Leia todo o histórico para formular a melhor resposta possível.

=== HABILIDADE PRINCIPAL: AGENDAMENTO DE CONSULTA ===
A lista de horários formatados e prontos para o paciente é:
{{ $('3a. Preparar Entrada da IA').item.json.horariosDisponiveisFormatados }}

(... restante da lógica de agendamento e outras regras ...)

HISTÓRICO DA CONVERSA ATUAL:
{{ $('3a. Preparar Entrada da IA').item.json.historicoFormatadoParaPrompt }}

=== TAREFA FINAL ===
Com base na ORDEM DE PRIORIDADE e em TODAS as regras e no histórico acima, gere a PRÓXIMA resposta para o usuário.`;

export function KnowledgeBaseManager() {
  const [rawInstructions, setRawInstructions] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/knowledge-base');
        if (!response.ok) throw new Error('Falha ao carregar dados do prompt.');
        const data = await response.json();
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
  
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError('');
    try {
        const response = await fetch('/api/admin/knowledge-base', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawInstructions }),
        });
        if (!response.ok) throw new Error('Falha ao salvar rascunho.');
        alert('Rascunho salvo com sucesso!');
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar rascunho.');
    } finally {
        setIsSaving(false);
    }
  }

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

  if (isLoading) return <p className="text-center mt-8 text-muted-foreground">Carregando gerenciador de prompt...</p>;

  return (
    <div className="space-y-8">
        <h2 className="text-xl font-semibold">Gerenciamento da Base de Conhecimento da IA</h2>
        
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

        <div>
            <label htmlFor="rawInstructions" className="form-label">
                Instruções para a IA (Base de Conhecimento)
            </label>
            <p className="text-sm text-muted-foreground mb-2">
                Adicione aqui informações, regras e diretrizes que a Silv.IA deve saber.
            </p>
            <textarea
                id="rawInstructions"
                value={rawInstructions}
                onChange={(e) => setRawInstructions(e.target.value)}
                rows={10}
                className="form-input w-full"
                placeholder="Ex: O horário de almoço é das 12h às 13h."
            />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
             <Button onClick={handleSaveDraft} disabled={isSaving || isPublishing} variant="secondary">
                {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <ProgressButton 
              onClick={handlePublish} 
              isLoading={isPublishing} 
              disabled={isSaving}
            >
                {isPublishing ? 'Publicando com IA...' : 'Gerar e Publicar Conhecimento'}
            </ProgressButton>
        </div>

         <div>
            <h3 className="text-lg font-semibold">Conhecimento Publicado (Em uso pelo n8n)</h3>
            <div className="mt-2 p-4 bg-muted border rounded-md text-sm text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                {knowledgeText || 'Nenhuma base de conhecimento foi publicada ainda.'}
            </div>
        </div>

        <div className="border-t pt-8">
            <label htmlFor="basePrompt" className="form-label text-destructive">
                Prompt Base (PERIGO: Apenas Visualização)
            </label>
            <p className="text-sm text-muted-foreground mb-2">
               Esta é a estrutura principal do prompt usada no n8n. Ela não é editável por aqui.
            </p>
            <textarea
                id="basePrompt"
                readOnly
                value={basePromptText}
                rows={15}
                className="form-input w-full font-mono text-xs bg-muted/50 cursor-not-allowed"
            />
        </div>
    </div>
  );
}