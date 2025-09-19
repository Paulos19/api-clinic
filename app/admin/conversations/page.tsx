import { ExportManager } from '../_components/ExportManager';

export default function ConversationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Exportar Conversas</h1>
                <p className="text-sm text-muted-foreground">
                    Faça o download de todos os históricos de conversas em um único arquivo JSON.
                </p>
            </div>

            <div className="w-full bg-card p-6 sm:p-8 rounded-lg shadow-sm border">
                <ExportManager />
            </div>
        </div>
    );
}