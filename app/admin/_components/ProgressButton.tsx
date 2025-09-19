'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProgressButtonProps extends React.ComponentProps<typeof Button> {
  isLoading: boolean;
}

export function ProgressButton({
  isLoading,
  children,
  className,
  ...props
}: ProgressButtonProps) {
  return (
    <Button
      className={cn('relative overflow-hidden', className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-primary/50"
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </Button>
  );
}