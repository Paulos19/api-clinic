import Link from 'next/link';
import { Package2 } from 'lucide-react';
import { NavLinks } from './NavLinks';

export function Sidebar() {
  return (
    // A classe h-full garante que a sidebar se estique verticalmente.
    <div className="hidden h-full border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span>Silv.IA Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto"> {/* Adicionado para o caso de muitos links */}
          <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
            <NavLinks isCollapsed={false} />
          </nav>
        </div>
      </div>
    </div>
  );
}