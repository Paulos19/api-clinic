'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Loader } from 'lucide-react';

import { ProgressButton } from './ProgressButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface KnowledgeField {
    id: string;
    title: string;
    content: string;
}

export function KnowledgeBaseManager() {
  const [fields, setFields] = useState<KnowledgeField[]>([]);
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
        if (!response.ok) throw new Error('Falha ao carregar dados.');
        const data = await response.json();
        setFields(data.fields || []);
        setKnowledgeText(data.knowledgeText || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFieldChange = (index: number, key: 'title' | 'content', value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { id: `new-${Date.now()}`, title: '', content: '' }]);
  };

  const removeField = (idToRemove: string) => {
    setFields(fields.filter(field => field.id !== idToRemove));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError('');
    try {
        const fieldsToSave = fields.map(({ id, title, content }) => ({
            id: id.startsWith('new-') ? undefined : id,
            title,
            content,
        }));

        const response = await fetch('/api/admin/knowledge-base', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fieldsToSave),
        });
        if (!response.ok) throw new Error('Falha ao salvar rascunho.');
        alert('Rascunho salvo com sucesso!');
        // Recarrega os dados para obter os IDs corretos do banco de dados
        const freshData = await fetch('/api/admin/knowledge-base').then(res => res.json());
        setFields(freshData.fields || []);
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
        await handleSaveDraft();

        const response = await fetch('/api/admin/knowledge-base', { method: 'PUT' });
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

  if (isLoading) return <div className="flex items-center justify-center mt-8 text-muted-foreground"><Loader className="animate-spin mr-2" />Carregando...</div>;

  return (
    <div className="space-y-8">
        <h2 className="text-xl font-semibold">Gerenciador da Base de Conhecimento</h2>
        
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

        <div className="space-y-6">
            <AnimatePresence>
                {fields.map((field, index) => (
                    <motion.div 
                        key={field.id}
                        layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 border rounded-lg bg-background space-y-3"
                    >
                        <div className="flex justify-between items-center">
                            <label className="form-label">Campo de Conhecimento #{index + 1}</label>
                            <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                         <Input
                            placeholder="Título do Tópico (ex: Horário de Funcionamento)"
                            value={field.title}
                            onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                        />
                        <Textarea
                            placeholder="Conteúdo do tópico..."
                            value={field.content}
                            onChange={(e) => handleFieldChange(index, 'content', e.target.value)}
                            rows={4}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
            <Button variant="outline" onClick={addField} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo
            </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
             <Button onClick={handleSaveDraft} disabled={isSaving || isPublishing} variant="secondary">
                {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <ProgressButton 
              onClick={handlePublish} 
              isLoading={isPublishing} 
              disabled={isSaving || fields.length === 0}
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
    </div>
  );
}