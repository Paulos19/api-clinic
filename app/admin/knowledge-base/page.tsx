import { KnowledgeBaseManager } from '../_components/KnowledgeBaseManager';

export default function KnowledgeBasePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie o prompt e as instruções que a IA utiliza para responder aos pacientes.
                </p>
            </div>

            <div className="w-full bg-card p-6 sm:p-8 rounded-lg shadow-sm border">
                <KnowledgeBaseManager />
            </div>
        </div>
    );
}