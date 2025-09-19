'use client';

import { Sidebar } from './_components/Sidebar';
import { Header } from './_components/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // A sidebar terá largura fixa e o conteúdo principal ocupará o resto.
    <div className="grid h-screen w-full overflow-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* A Sidebar permanece como está, fixa pela estrutura do grid. */}
      <Sidebar />

      {/* Este contêiner agora agrupa o Header e o conteúdo principal. */}
      <div className="flex flex-col h-screen">
        <Header />
        {/* A tag <main> se torna a área de scroll. */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}