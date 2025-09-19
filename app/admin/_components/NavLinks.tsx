'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Settings, LayoutDashboard, Stars } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/conversations', icon: MessageSquare, label: 'Conversas' },
  { href: '/admin/knowledge-base', icon: Stars, label: 'Base de Conhecimento' },
  { href: '/admin/settings', icon: Settings, label: 'Configurações' },
];

export function NavLinks({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      {links.map((link) => (
        <Tooltip key={link.href} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={link.href}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:h-8',
                pathname === link.href && 'bg-accent text-primary',
                isCollapsed ? 'w-9' : 'w-full justify-start gap-3'
              )}
            >
              <link.icon className="h-4 w-4" />
              <span className={cn('sr-only', !isCollapsed && 'not-sr-only')}>
                {link.label}
              </span>
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">{link.label}</TooltipContent>
          )}
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}