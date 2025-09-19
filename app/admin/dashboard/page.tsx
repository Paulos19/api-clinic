import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, MessageSquareText, FileJson } from "lucide-react";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getDashboardStats() {
    const kb = await prisma.knowledgeBase.findUnique({
        where: { id: 1 },
        select: { updateCount: true, knowledgeText: true }
    });

    const conversationCount = await prisma.conversation.count();
    
    return {
        updateCount: kb?.updateCount || 0,
        knowledgeText: kb?.knowledgeText || 'Nenhuma base de conhecimento publicada.',
        conversationCount,
    }
}

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Atualizações da Base de Conhecimento</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.updateCount}</div>
                        <p className="text-xs text-muted-foreground">Vezes que o conhecimento foi publicado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Mensagens Salvas</CardTitle>
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.conversationCount}</div>
                        <p className="text-xs text-muted-foreground">Registros no banco de dados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Regras e Habilidades Atuais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <code className="font-mono text-xs bg-muted p-1 rounded-md">/receita</code>
                            <span>- Inicia o fluxo de solicitação de receita.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="font-mono text-xs bg-muted p-1 rounded-md">[AGENDAMENTO_PRONTO]</code>
                            <span>- Sinaliza um agendamento via IA para a API.</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <code className="font-mono text-xs bg-muted p-1 rounded-md">State Machine</code>
                            <span>- Gerencia agendamentos e receitas passo a passo.</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Base de Conhecimento Atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground max-h-48 overflow-y-auto">
                            {stats.knowledgeText}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}